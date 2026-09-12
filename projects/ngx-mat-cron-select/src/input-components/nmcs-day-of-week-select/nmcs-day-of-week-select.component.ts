import { AsyncPipe } from '@angular/common';
import { Component, computed, forwardRef, inject, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { Field, FieldTree, FormField } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { getWeekStartByLocale } from 'weekstart';
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
    MatError,
    AsyncPipe,
    MatCheckbox,
    FormField,
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
export class NmcsDayOfWeekSelectComponent<FormControlValue extends TNmcsValue> {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly weekFormat = inject(NGX_MAT_CRON_SELECT_WEEK_FORMAT, { optional: true });

  public readonly field = input.required<Field<FormControlValue>>();
  public readonly periodicCheckboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly periodicStepFieldTree = input.required<FieldTree<number> | null>();
  public readonly isPeriodicCheckboxVisible = input.required<boolean>();
  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));

  protected readonly options = this.prepareOrderedOptions();

  protected readonly stepOptions = Array(7)
    .fill(null)
    .map((_, index) => index + 1);

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
