import { BehaviorSubject, Observable, of } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { INMCSTranslations, provideNMCSTranslations } from './utilities';

const translations: Record<'en' | 'tr', INMCSTranslations> = {
  en: {
    dayOfMonthSelectLabel: 'Select days',
    dayOfWeekSelectLabel: 'Select days of week',
    hourSelectLabel: 'Select hours',
    minuteSelectLabel: 'Select minutes',
    monthSelectLabel: 'Select months',
    tabLabelDay: 'Day',
    tabLabelHour: 'Hour',
    tabLabelMonth: 'Month',
    tabLabelWeek: 'Week',
    tabLabelYear: 'Year',
    periodicDayStepLabel: 'Every {{n}} days',
    periodicStepLabelOverrides: {
      day: { 1: 'Every Day', 2: 'Every other day' },
    },
  },
  tr: {
    dayOfMonthSelectLabel: 'Günleri seç',
    dayOfWeekSelectLabel: 'Haftanın günlerini seç',
    hourSelectLabel: 'Saatleri seç',
    minuteSelectLabel: 'Dakikaları seç',
    monthSelectLabel: 'Ayları seç',
    tabLabelDay: 'Gün',
    tabLabelHour: 'Saat',
    tabLabelMonth: 'Ay',
    tabLabelWeek: 'Hafta',
    tabLabelYear: 'Yıl',
  },
};

type TLanguage = 'en' | 'tr';

describe('provideNMCSTranslations', () => {
  it('provides NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE', () => {
    const provider = provideNMCSTranslations(of(translations), of<TLanguage>('en'));

    expect(provider).toEqual(jasmine.objectContaining({ provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE }));
  });

  it('strips the "ngxMatCronSelect." prefix and resolves the translation for the current language', (done) => {
    const provider = provideNMCSTranslations(of(translations), of<TLanguage>('en'));
    const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

    service.stream('ngxMatCronSelect.hourSelectLabel').subscribe((value: string) => {
      expect(value).toBe('Select hours');
      done();
    });
  });

  it('resolves against the translations of the currently emitted language', (done) => {
    const provider = provideNMCSTranslations(of(translations), of<TLanguage>('tr'));
    const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

    service.stream('ngxMatCronSelect.hourSelectLabel').subscribe((value: string) => {
      expect(value).toBe('Saatleri seç');
      done();
    });
  });

  it('re-emits when the language observable emits a new value', () => {
    const language = new BehaviorSubject<'en' | 'tr'>('en');
    const provider = provideNMCSTranslations(of(translations), language);
    const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;
    const emitted: string[] = [];

    service.stream('ngxMatCronSelect.tabLabelHour').subscribe((value: string) => emitted.push(value));
    language.next('tr');

    expect(emitted).toEqual(['Hour', 'Saat']);
  });

  it('re-emits when the translations observable emits a new value', () => {
    const translationsSubject = new BehaviorSubject(translations);
    const provider = provideNMCSTranslations(translationsSubject, of('en'));
    const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;
    const emitted: string[] = [];

    service.stream('ngxMatCronSelect.tabLabelHour').subscribe((value: string) => emitted.push(value));
    translationsSubject.next({
      ...translations,
      en: { ...translations.en, tabLabelHour: 'Updated Hour' },
    });

    expect(emitted).toEqual(['Hour', 'Updated Hour']);
  });

  describe('periodic step label overrides', () => {
    it('resolves the step-1 override ("*"/every), the same convention used for every other step number', (done) => {
      const provider = provideNMCSTranslations(of(translations), of<TLanguage>('en'));
      const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

      service.stream('ngxMatCronSelect.periodicDayStepLabel_1').subscribe((value: string) => {
        expect(value).toBe('Every Day');
        done();
      });
    });

    it('resolves a specific per-number override via the "<key>_<n>" convention', (done) => {
      const provider = provideNMCSTranslations(of(translations), of<TLanguage>('en'));
      const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

      service.stream('ngxMatCronSelect.periodicDayStepLabel_2').subscribe((value: string) => {
        expect(value).toBe('Every other day');
        done();
      });
    });

    it('echoes back the requested key when no override exists for that number', (done) => {
      const provider = provideNMCSTranslations(of(translations), of<TLanguage>('en'));
      const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

      service.stream('ngxMatCronSelect.periodicDayStepLabel_5').subscribe((value: string) => {
        expect(value).toBe('ngxMatCronSelect.periodicDayStepLabel_5');
        done();
      });
    });

    it('echoes back the requested key when an optional translation property is altogether missing', (done) => {
      const provider = provideNMCSTranslations(of(translations), of<TLanguage>('tr'));
      const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

      service.stream('ngxMatCronSelect.periodicDayStepLabel').subscribe((value: string) => {
        expect(value).toBe('ngxMatCronSelect.periodicDayStepLabel');
        done();
      });
    });
  });
});
