import { Provider } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';

export interface INMCSTranslations {
  dayOfMonthSelectLabel: string;
  dayOfWeekSelectLabel: string;
  everyMinuteLabel: string;
  hourSelectLabel: string;
  minuteSelectLabel: string;
  monthSelectLabel: string;
  tabLabelHour: string;
  tabLabelDay: string;
  tabLabelWeek: string;
  tabLabelMonth: string;
  tabLabelYear: string;
}

export function provideNMCSTranslations<Language extends string>(
  translations: Observable<Record<Language, INMCSTranslations>>,
  language: Observable<Language>,
): Provider {
  return {
    provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE,
    useValue: {
      stream: (key: string) =>
        combineLatest({
          language,
          translations,
        }).pipe(
          map(({ translations, language }) => {
            const simplifiedKey = key.split('.')[1] as keyof INMCSTranslations;

            return translations[language][simplifiedKey];
          }),
        ),
    },
  };
}
