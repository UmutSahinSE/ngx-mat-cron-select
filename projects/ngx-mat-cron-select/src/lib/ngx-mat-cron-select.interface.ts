import { FormControl } from '@angular/forms';
import { TNmcsValue } from '../input-components/nmcs-input.component';

export enum ECronSelectTab {
  hour = 0,
  day = 1,
  week = 2,
  month = 3,
  year = 4,
}

export interface IInputsFormGroupValue {
  dayOfMonth: TNmcsValue;
  dayOfWeek: TNmcsValue;
  hour: TNmcsValue;
  minute: TNmcsValue;
  monthOfYear: TNmcsValue;
}

export interface IEveryCheckboxesFormGroupValue {
  dayOfMonth: boolean;
  dayOfWeek: boolean;
  hour: boolean;
  minute: boolean;
  monthOfYear: boolean;
}

export const twelveHourLocales: readonly string[] = [
  'en-US',
  'en-AU',
  'en-CA',
  'en-NZ',
  'en-PH',
  'en-IN',
  'es-MX',
  'en-IE',
] as const;

export interface IInputsFormGroup {
  dayOfMonth: FormControl<TNmcsValue>;
  dayOfWeek: FormControl<TNmcsValue>;
  hour: FormControl<TNmcsValue>;
  minute: FormControl<TNmcsValue>;
  monthOfYear: FormControl<TNmcsValue>;
}

export interface IEveryCheckboxesFormGroup {
  dayOfMonth: FormControl<boolean>;
  dayOfWeek: FormControl<boolean>;
  hour: FormControl<boolean>;
  minute: FormControl<boolean>;
  monthOfYear: FormControl<boolean>;
}
