import { Component, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { NGX_MAT_CRON_SELECT_WEEK_FORMAT } from '../../tokens';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { NmcsInput, TNmcsValue } from '../nmcs-input.component';
import { AsyncPipe } from '@angular/common';

@Component({
  imports: [MatFormField, TranslateOrUseDefaultPipe, ReactiveFormsModule, MatSelect, MatLabel, MatOption, MatError, AsyncPipe],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NmcsMonthOfYearSelectComponent),
    },
  ],
  selector: 'nmcs-month-of-year-select',
  styleUrl: './nmcs-month-of-year-select.component.scss',
  templateUrl: './nmcs-month-of-year-select.component.html',
})
export class NmcsMonthOfYearSelectComponent<FormControlValue extends TNmcsValue> extends NmcsInput<FormControlValue> {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly monthFormat = inject(NGX_MAT_CRON_SELECT_WEEK_FORMAT, { optional: true });
  protected readonly options = this.prepareOrderedOptions();

  constructor() {
    super();
  }

  private prepareOrderedOptions(): { cronValue: number; label: string }[] {
    const locale = this.matDateLocale ?? 'en-US';
    const monthFormat = this.monthFormat ?? 'long';
    const formatter = new Intl.DateTimeFormat(locale, { month: monthFormat });

    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(2020, index, 1));

      return { cronValue: index, label: formatter.format(date) };
    });
  }
}
