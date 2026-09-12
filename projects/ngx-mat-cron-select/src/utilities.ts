import { Provider } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';

export type TPeriodicStepLabelUnit = 'minute' | 'hour' | 'day' | 'month';

export interface INMCSTranslations {
  dayOfMonthSelectLabel: string;
  dayOfWeekSelectLabel: string;
  hourSelectLabel: string;
  minuteSelectLabel: string;
  monthSelectLabel: string;
  /**
   * Generic step-count template, e.g. 'Every {{n}} minutes' — `{{n}}` is replaced with the step number. Also
   * covers step 1 (the `*` option, including the periodic checkbox's own resting label) via
   * `periodicStepLabelOverrides`, so there's no separate "every X" key to keep in sync with it.
   */
  periodicMinuteStepLabel?: string;
  periodicHourStepLabel?: string;
  periodicDayStepLabel?: string;
  periodicMonthStepLabel?: string;
  /**
   * Per-number exceptions to the generic `periodic<Unit>StepLabel` templates above, tried before falling back
   * to the template — e.g. `{ day: { 1: 'Every Day', 2: 'Every other day' } }` so English reads naturally for
   * the step-1 and step-2 cases, while a language whose generic template already reads naturally for every n
   * (e.g. Turkish's '{{n}} günde bir') needs no override at all.
   */
  periodicStepLabelOverrides?: Partial<Record<TPeriodicStepLabelUnit, Record<number, string>>>;
  tabLabelHour: string;
  tabLabelDay: string;
  tabLabelWeek: string;
  tabLabelMonth: string;
  tabLabelYear: string;
}

const periodicStepLabelKeys: readonly (keyof INMCSTranslations)[] = [
  'periodicMinuteStepLabel',
  'periodicHourStepLabel',
  'periodicDayStepLabel',
  'periodicMonthStepLabel',
];

export const stepLabelUnitByKey: Partial<Record<keyof INMCSTranslations, TPeriodicStepLabelUnit>> = {
  periodicDayStepLabel: 'day',
  periodicHourStepLabel: 'hour',
  periodicMinuteStepLabel: 'minute',
  periodicMonthStepLabel: 'month',
};

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
            const languageTranslations = translations[language];
            const [, simplifiedKeyPart] = key.split('.');

            for (const stepLabelKey of periodicStepLabelKeys) {
              const overridePrefix = `${stepLabelKey}_`;

              if (simplifiedKeyPart.startsWith(overridePrefix)) {
                const n = Number(simplifiedKeyPart.slice(overridePrefix.length));
                const unit = stepLabelUnitByKey[stepLabelKey]!;
                const override = languageTranslations.periodicStepLabelOverrides?.[unit]?.[n];

                return override ?? key;
              }
            }

            const simplifiedKey = simplifiedKeyPart as keyof INMCSTranslations;

            return (languageTranslations[simplifiedKey] as string | undefined) ?? key;
          }),
        ),
    },
  };
}
