import { AsyncPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Field, FieldTree, FormField } from '@angular/forms/signals';
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
    FormField,
  ],
  selector: 'nmcs-minute-select',
  styleUrl: './nmcs-minute-select.component.scss',
  templateUrl: './nmcs-minute-select.component.html',
})
export class NmcsMinuteSelectComponent<FormControlValue extends TNmcsValue> {
  public readonly field = input.required<Field<FormControlValue>>();
  public readonly checkboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly isCheckboxVisible = input.required<boolean>();

  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));

  protected readonly minuteOptions = Array(60)
    .fill(null)
    .map((_, index) => index);
}
