import { InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export const NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR = new InjectionToken<Signal<boolean>>(
  'ngx-mat-cron-select/IS_TWELVE_HOUR',
);

export const NGX_MAT_CRON_SELECT_WEEK_FORMAT = new InjectionToken<'long' | 'short' | 'narrow'>(
  'ngx-mat-cron-select/WEEK_FORMAT',
);

export const NGX_MAT_CRON_SELECT_MONTH_FORMAT = new InjectionToken<'long' | 'short' | 'narrow' | 'numeric' | '2-digit'>(
  'ngx-mat-cron-select/MONTH_FORMAT',
);

export const NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE = new InjectionToken<{
  stream: (key: string) => Observable<string | any>;
}>('ngx-mat-cron-select/TRANSLATE_SERVICE');
