import { Provider } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';

export interface INMCSTranslations {
  dayOfMonthSelectLabel: string;
  dayOfWeekSelectLabel: string;
  everyMinuteLabel: string;
  everyHourLabel: string;
  everyDayLabel: string;
  everyMonthLabel: string;
  hourSelectLabel: string;
  minuteSelectLabel: string;
  monthSelectLabel: string;
  tabLabelHour: string;
  tabLabelDay: string;
  tabLabelWeek: string;
  tabLabelMonth: string;
  tabLabelYear: string;
  repeatMinute: string;
}

export function provideNMCSTranslations<Language extends string>(
  translations: Observable<Record<Language, INMCSTranslations>>,
  language: Observable<Language>,
): Provider {
  return {
    provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE,
    useValue: {
      stream: (key: string, interpolationParams: Record<string, string> = {}) =>
        combineLatest({
          language,
          translations,
        }).pipe(
          map(({ translations, language }) => {
            const simplifiedKey = key.split('.')[1] as keyof INMCSTranslations;
            const translatedValue = translations[language][simplifiedKey];

            return Object.entries(interpolationParams).reduce(
              (reducePayload, [paramKey, value]) => reducePayload.replaceAll(`{{${paramKey}}}`, value),
              translatedValue,
            );
          }),
        ),
    },
  };
}
