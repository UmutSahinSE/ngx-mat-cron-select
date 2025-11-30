import { inject, Pipe, PipeTransform } from '@angular/core';
import { map, Observable, of, startWith } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { INMCSTranslations } from './utilities';

const noTranslationValues: INMCSTranslations = {
  dayOfMonthSelectLabel: 'Select days',
  dayOfWeekSelectLabel: 'Select days of week',
  everyDayLabel: 'Every Day',
  everyHourLabel: 'Every Hour',
  everyMinuteLabel: 'Every Minute',
  everyMonthLabel: 'Every Month',
  hourSelectLabel: 'Select hours',
  minuteSelectLabel: 'Select minutes',
  monthSelectLabel: 'Select months',
  repeatMinute: 'Every {{repeat}}. minute',
  tabLabelDay: 'Hour',
  tabLabelHour: 'Day',
  tabLabelMonth: 'Month',
  tabLabelWeek: 'Week',
  tabLabelYear: 'Year',
};

@Pipe({ name: 'translateOrUseDefault' })
export class TranslateOrUseDefaultPipe implements PipeTransform {
  private readonly translate = inject(NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE, { optional: true });

  public transform(key: keyof INMCSTranslations, interpolationParams: Record<string, string> = {}): Observable<string> {
    const defaultTranslation = noTranslationValues[key];

    return this.translate
      ? this.translate.stream(`ngxMatCronSelect.${key}`, interpolationParams).pipe(
          map((res) => (res === `ngxMatCronSelect.${key}` ? defaultTranslation : res)),
          startWith(defaultTranslation),
        )
      : of(defaultTranslation);
  }
}
