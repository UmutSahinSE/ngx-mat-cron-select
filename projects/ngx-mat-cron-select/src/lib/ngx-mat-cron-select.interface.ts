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
