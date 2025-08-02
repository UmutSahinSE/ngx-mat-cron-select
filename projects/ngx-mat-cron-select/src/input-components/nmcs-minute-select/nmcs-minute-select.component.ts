import { AsyncPipe } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatError } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { NmcsInput, TNmcsValue } from '../nmcs-input.component';

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
  ],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NmcsMinuteSelectComponent),
    },
  ],
  selector: 'nmcs-minute-select',
  styleUrl: './nmcs-minute-select.component.scss',
  templateUrl: './nmcs-minute-select.component.html',
})
export class NmcsMinuteSelectComponent<FormControlValue extends TNmcsValue> extends NmcsInput<FormControlValue> {
  public readonly everyMinuteFormControl = input.required<FormControl<boolean> | null>();
  public readonly isEveryMinuteCheckboxVisible = input.required<boolean>();
  protected readonly minuteOptions = Array(60)
    .fill(null)
    .map((_, index) => index);

  constructor() {
    super();
  }
}
