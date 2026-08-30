import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE } from './tokens';
import { TranslateOrUseDefaultPipe } from './translate-or-use-default.pipe';

describe('TranslateOrUseDefaultPipe', () => {
  it('emits the default translation synchronously when no translate service is provided', async () => {
    TestBed.configureTestingModule({});
    const pipe = TestBed.runInInjectionContext(() => new TranslateOrUseDefaultPipe());

    const value = await firstValueFrom(pipe.transform('everyHourLabel'));

    expect(value).toBe('Every Hour');
  });

  it('emits the default translation first, then the resolved translation, when a service is provided', async () => {
    const stream = new Subject<string>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE,
          useValue: { stream: (): Observable<string> => stream.asObservable() },
        },
      ],
    });
    const pipe = TestBed.runInInjectionContext(() => new TranslateOrUseDefaultPipe());

    const values = firstValueFrom(pipe.transform('everyHourLabel').pipe(take(2), toArray()));
    stream.next('Toutes les heures');

    expect(await values).toEqual(['Every Hour', 'Toutes les heures']);
  });

  it('falls back to the default translation when the service echoes back the untranslated key', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE,
          useValue: { stream: (key: string): Observable<string> => of(key) },
        },
      ],
    });
    const pipe = TestBed.runInInjectionContext(() => new TranslateOrUseDefaultPipe());

    const values = await firstValueFrom(pipe.transform('everyHourLabel').pipe(take(2), toArray()));

    expect(values).toEqual(['Every Hour', 'Every Hour']);
  });

  it('requests the namespaced key from the translate service', () => {
    const streamSpy = jasmine.createSpy('stream').and.returnValue(new Subject());
    TestBed.configureTestingModule({
      providers: [{ provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE, useValue: { stream: streamSpy } }],
    });
    const pipe = TestBed.runInInjectionContext(() => new TranslateOrUseDefaultPipe());

    pipe.transform('tabLabelWeek').subscribe();

    expect(streamSpy).toHaveBeenCalledWith('ngxMatCronSelect.tabLabelWeek');
  });
});
