import { inject, Pipe, PipeTransform } from '@angular/core';
import { map, Observable, of, startWith } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { INMCSTranslations } from './utilities';

const noTranslationValues: INMCSTranslations = {
  dayOfMonthSelectLabel: 'Select days',
  dayOfWeekSelectLabel: 'Select days of week',
  everyMinuteLabel: 'Every Minute',
  hourSelectLabel: 'Select hours',
  minuteSelectLabel: 'Select minutes',
  monthSelectLabel: 'Select months',
  tabLabelDay: 'Hour',
  tabLabelHour: 'Day',
  tabLabelMonth: 'Week',
  tabLabelWeek: 'Month',
  tabLabelYear: 'Year',
};

@Pipe({ name: 'translateOrUseDefault' })
export class TranslateOrUseDefaultPipe implements PipeTransform {
  private readonly translate = inject(NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE, { optional: true });

  public transform(key: keyof INMCSTranslations): Observable<string> {
    const defaultTranslation = noTranslationValues[key];

    return this.translate
      ? this.translate.stream(`ngxMatCronSelect.${key}`).pipe(
          map((res) => (res === `ngxMatCronSelect.${key}` ? defaultTranslation : res)),
          startWith(defaultTranslation),
        )
      : of(defaultTranslation);
  }
}
