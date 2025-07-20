import { AsyncPipe } from '@angular/common';
import { Component, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { getWeekStartByLocale } from 'weekstart';
import { NGX_MAT_CRON_SELECT_WEEK_FORMAT } from '../../tokens';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { NmcsInput, TNmcsValue } from '../nmcs-input.component';

@Component({
  imports: [
    MatFormField,
    TranslateOrUseDefaultPipe,
    ReactiveFormsModule,
    MatSelect,
    MatLabel,
    MatOption,
    MatError,
    AsyncPipe,
  ],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NmcsDayOfWeekSelectComponent),
    },
  ],
  selector: 'nmcs-day-of-week-select',
  styleUrl: './nmcs-day-of-week-select.component.scss',
  templateUrl: './nmcs-day-of-week-select.component.html',
})
export class NmcsDayOfWeekSelectComponent<FormControlValue extends TNmcsValue> extends NmcsInput<FormControlValue> {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly weekFormat = inject(NGX_MAT_CRON_SELECT_WEEK_FORMAT, { optional: true });
  protected readonly options = this.prepareOrderedOptions();

  constructor() {
    super();
  }

  private prepareOrderedOptions(): { cronValue: number; label: string }[] {
    const locale = this.matDateLocale ?? 'en-US';
    const weekFormat = this.weekFormat ?? 'long';
    const startDay = getWeekStartByLocale(locale);
    const options = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.UTC(2021, 7, 1));

      date.setUTCDate(date.getUTCDate() + index);

      return {
        cronValue: index,
        label: new Intl.DateTimeFormat(locale, { weekday: weekFormat }).format(date),
      };
    });

    return [...options.slice(startDay), ...options.slice(0, startDay)];
  }
}
