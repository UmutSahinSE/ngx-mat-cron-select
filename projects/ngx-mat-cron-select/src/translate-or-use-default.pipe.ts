import { inject, Pipe, PipeTransform } from '@angular/core';
import { combineLatest, map, Observable, of, startWith } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { INMCSTranslations, stepLabelUnitByKey } from './utilities';

const noTranslationValues: Required<INMCSTranslations> = {
  dayOfMonthSelectLabel: 'Select days',
  dayOfWeekSelectLabel: 'Select days of week',
  hourSelectLabel: 'Select hours',
  minuteSelectLabel: 'Select minutes',
  monthSelectLabel: 'Select months',
  periodicDayStepLabel: 'Every {{n}} days',
  periodicHourStepLabel: 'Every {{n}} hours',
  periodicMinuteStepLabel: 'Every {{n}} minutes',
  periodicMonthStepLabel: 'Every {{n}} months',
  // Step 1 (the "*" option, and the periodic checkbox's own resting label) for every unit, plus the one
  // irregular step-count exception to the generic {{n}} templates above: English's step-2 day case reads
  // "Every other day", not "Every 2 days". Everything else falls through to the generic template.
  periodicStepLabelOverrides: {
    day: { 1: 'Every day', 2: 'Every other day' },
    hour: { 1: 'Every hour', 2: 'Every other hour' },
    minute: { 1: 'Every minute', 2: 'Every other minute' },
    month: { 1: 'Every month', 2: 'Every other month' },
  },
  tabLabelDay: 'Day',
  tabLabelHour: 'Hour',
  tabLabelMonth: 'Month',
  tabLabelWeek: 'Week',
  tabLabelYear: 'Year',
};

@Pipe({ name: 'translateOrUseDefault' })
export class TranslateOrUseDefaultPipe implements PipeTransform {
  private readonly translate = inject(NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE, { optional: true });

  /**
   * `n`, when provided, requests the step-count variant of `key` (e.g. `periodicDayStepLabel`): a specific
   * translation for that exact number is tried first (key suffixed with `_${n}`), falling back to the generic
   * `{{n}}`-templated translation with the number substituted in, since "every Nth" phrasing isn't a simple
   * numeric substitution in every language (English "every other day" vs. a generic "every 2 days"). This
   * covers step 1 (the "*" option) too — there's no separate "every X" key, so a periodic checkbox's own
   * resting label is just its step select's step-1 label (`transform('periodicDayStepLabel', 1)`, etc.).
   */
  public transform(key: keyof INMCSTranslations, n?: number): Observable<string> {
    const defaultTranslation = this.getDefaultTranslation(key, n);

    if (!this.translate) {
      return of(defaultTranslation);
    }

    if (n === undefined) {
      const fullKey = `ngxMatCronSelect.${key}`;

      return this.translate.stream(fullKey).pipe(
        map((res) => (res === fullKey ? defaultTranslation : res)),
        startWith(defaultTranslation),
      );
    }

    const specificKey = `ngxMatCronSelect.${key}_${n}`;
    const genericKey = `ngxMatCronSelect.${key}`;

    return combineLatest([this.translate.stream(specificKey), this.translate.stream(genericKey)]).pipe(
      map(([specific, generic]) => {
        if (specific !== specificKey) {
          return specific;
        }

        return generic === genericKey ? defaultTranslation : this.interpolate(generic, n);
      }),
      startWith(defaultTranslation),
    );
  }

  /**
   * The built-in ("no translation configured") text for `key`, consulting `periodicStepLabelOverrides` first
   * when `n` names a step count with a known irregular default (e.g. day/2 -> "Every other day"), falling back
   * to the generic `{{n}}`-templated text otherwise.
   */
  private getDefaultTranslation(key: keyof INMCSTranslations, n: number | undefined): string {
    if (n !== undefined) {
      const unit = stepLabelUnitByKey[key];
      const override = unit && noTranslationValues.periodicStepLabelOverrides[unit]?.[n];

      if (override) {
        return override;
      }
    }

    return this.interpolate(noTranslationValues[key] as string, n);
  }

  private interpolate(template: string, n: number | undefined): string {
    return n === undefined ? template : template.replace('{{n}}', String(n));
  }
}
