import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Field, FieldTree, FormField } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { NGX_MAT_CRON_SELECT_MONTH_FORMAT } from '../../tokens';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { TNmcsValue } from '../nmcs-input.interface';

@Component({
  imports: [
    MatFormField,
    TranslateOrUseDefaultPipe,
    ReactiveFormsModule,
    MatSelect,
    MatLabel,
    MatOption,
    AsyncPipe,
    MatCheckbox,
    FormField,
  ],
  selector: 'nmcs-month-of-year-select',
  styleUrl: './nmcs-month-of-year-select.component.scss',
  templateUrl: './nmcs-month-of-year-select.component.html',
})
export class NmcsMonthOfYearSelectComponent<FormControlValue extends TNmcsValue> {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly monthFormat = inject(NGX_MAT_CRON_SELECT_MONTH_FORMAT, { optional: true });

  public readonly field = input.required<Field<FormControlValue>>();
  public readonly periodicCheckboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly periodicStepFieldTree = input.required<FieldTree<number> | null>();
  public readonly isPeriodicCheckboxVisible = input.required<boolean>();

  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));

  protected readonly options = this.prepareOrderedOptions();

  protected readonly stepOptions = Array(12)
    .fill(null)
    .map((_, index) => index + 1);

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
