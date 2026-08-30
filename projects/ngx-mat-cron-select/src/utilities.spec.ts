import { BehaviorSubject, Observable, of } from 'rxjs';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { INMCSTranslations, provideNMCSTranslations } from './utilities';

const translations: Record<'en' | 'tr', INMCSTranslations> = {
  en: {
    dayOfMonthSelectLabel: 'Select days',
    dayOfWeekSelectLabel: 'Select days of week',
    everyDayLabel: 'Every Day',
    everyHourLabel: 'Every Hour',
    everyMinuteLabel: 'Every Minute',
    everyMonthLabel: 'Every Month',
    hourSelectLabel: 'Select hours',
    minuteSelectLabel: 'Select minutes',
    monthSelectLabel: 'Select months',
    tabLabelDay: 'Day',
    tabLabelHour: 'Hour',
    tabLabelMonth: 'Month',
    tabLabelWeek: 'Week',
    tabLabelYear: 'Year',
  },
  tr: {
    dayOfMonthSelectLabel: 'Günleri seç',
    dayOfWeekSelectLabel: 'Haftanın günlerini seç',
    everyDayLabel: 'Her Gün',
    everyHourLabel: 'Her Saat',
    everyMinuteLabel: 'Her Dakika',
    everyMonthLabel: 'Her Ay',
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

    service.stream('ngxMatCronSelect.everyHourLabel').subscribe((value: string) => {
      expect(value).toBe('Every Hour');
      done();
    });
  });

  it('resolves against the translations of the currently emitted language', (done) => {
    const provider = provideNMCSTranslations(of(translations), of<TLanguage>('tr'));
    const service = (provider as { useValue: { stream: (key: string) => Observable<string> } }).useValue;

    service.stream('ngxMatCronSelect.everyHourLabel').subscribe((value: string) => {
      expect(value).toBe('Her Saat');
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
});
