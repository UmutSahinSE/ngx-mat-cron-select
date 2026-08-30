import { AsyncPipe } from '@angular/common';
import { Component, computed, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { Field, FieldTree } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatError } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { TNmcsValue } from '../nmcs-input.interface';

@Component({
  imports: [
    MatError,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    TranslateOrUseDefaultPipe,
    ReactiveFormsModule,
    AsyncPipe,
    MatCheckbox,
    Field,
  ],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NmcsDayOfMonthSelectComponent),
    },
  ],
  selector: 'nmcs-day-of-month-select',
  styleUrl: './nmcs-day-of-month-select.component.scss',
  templateUrl: './nmcs-day-of-month-select.component.html',
})
export class NmcsDayOfMonthSelectComponent<FormControlValue extends TNmcsValue> {
  public readonly field = input.required<FieldTree<FormControlValue>>();
  public readonly checkboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly isCheckboxVisible = input.required<boolean>();

  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));

  protected readonly options = Array(31)
    .fill(null)
    .map((_, index) => index + 1);
}
