import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatError } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { NmcsInput, TNmcsValue } from '../nmcs-input.component';

@Component({
  imports: [MatError, MatFormField, MatLabel, MatOption, MatSelect, TranslateOrUseDefaultPipe, ReactiveFormsModule],
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
  protected readonly minuteOptions = Array(60)
    .fill(null)
    .map((_, index) => index);

  constructor() {
    super();
  }
}
