import { FormControl } from '@angular/forms';
import { SchemaOrSchemaFn } from '@angular/forms/signals';
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

export interface ICompatInputsFormGroup {
  dayOfMonth: FormControl<TNmcsValue>;
  dayOfWeek: FormControl<TNmcsValue>;
  hour: FormControl<TNmcsValue>;
  minute: FormControl<TNmcsValue>;
  monthOfYear: FormControl<TNmcsValue>;
}

/**
 * Extra schema logic to layer on top of NgxMatCronSelectComponent's own inputsForm rules, passed to
 * createInputsSchema(). `fields` targets one or more specific fields; `form` receives the whole schema, e.g. for
 * cross-field rules.
 */
export interface IInputsSchemaCustomization {
  fields?: Partial<Record<keyof IInputsFormGroup, SchemaOrSchemaFn<TNmcsValue>>>;
  form?: SchemaOrSchemaFn<IInputsFormGroup>;
}

/**
 * Extra schema logic to layer on top of NgxMatCronSelectComponent's own repeatingCheckboxForm rules, passed
 * to createRepeatingCheckboxesSchema(). `fields` targets one or more specific checkboxes; `form` receives the
 * whole schema.
 */
export interface IEveryCheckboxesSchemaCustomization {
  fields?: Partial<Record<keyof IEveryCheckboxesFormGroupValue, SchemaOrSchemaFn<boolean>>>;
  form?: SchemaOrSchemaFn<IEveryCheckboxesFormGroupValue>;
}
