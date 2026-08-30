import { TNmcsValue } from '../input-components/nmcs-input.interface';

export interface ITab {
  hour: boolean;
  day: boolean;
  week: boolean;
  month: boolean;
  year: boolean;
}

export interface IEveryCheckboxesFormGroupValue {
  day: boolean;
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
  dayOfMonth: TNmcsValue;
  dayOfWeek: TNmcsValue;
  hour: TNmcsValue;
  minute: TNmcsValue;
  monthOfYear: TNmcsValue;
}
