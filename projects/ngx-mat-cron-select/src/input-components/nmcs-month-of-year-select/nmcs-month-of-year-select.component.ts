import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Field, FieldTree } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { NGX_MAT_CRON_SELECT_WEEK_FORMAT } from '../../tokens';
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
    Field,
  ],
  selector: 'nmcs-month-of-year-select',
  styleUrl: './nmcs-month-of-year-select.component.scss',
  templateUrl: './nmcs-month-of-year-select.component.html',
})
export class NmcsMonthOfYearSelectComponent<FormControlValue extends TNmcsValue> {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly monthFormat = inject(NGX_MAT_CRON_SELECT_WEEK_FORMAT, { optional: true });

  public readonly field = input.required<FieldTree<FormControlValue>>();
  public readonly checkboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly isCheckboxVisible = input.required<boolean>();

  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));
  protected readonly options = this.prepareOrderedOptions();

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
