import { AsyncPipe } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
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
export class NmcsDayOfMonthSelectComponent<FormControlValue extends TNmcsValue> extends NmcsInput<FormControlValue> {
  protected readonly options = Array(30)
    .fill(null)
    .map((_, index) => index + 1);

  constructor() {
    super();
  }
}
