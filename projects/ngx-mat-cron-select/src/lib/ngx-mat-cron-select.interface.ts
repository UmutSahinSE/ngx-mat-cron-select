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

export interface IPeriodicCheckboxesFormGroupValue {
  day: boolean;
  hour: boolean;
  minute: boolean;
  monthOfYear: boolean;
}

export interface IPeriodicStepsFormGroupValue {
  day: number;
  hour: number;
  minute: number;
  monthOfYear: number;
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
 * Extra schema logic to layer on top of NgxMatCronSelectComponent's own periodicCheckboxForm rules, passed
 * to createPeriodicCheckboxesSchema(). `fields` targets one or more specific checkboxes; `form` receives the
 * whole schema.
 */
export interface IPeriodicCheckboxesSchemaCustomization {
  fields?: Partial<Record<keyof IPeriodicCheckboxesFormGroupValue, SchemaOrSchemaFn<boolean>>>;
  form?: SchemaOrSchemaFn<IPeriodicCheckboxesFormGroupValue>;
}

/**
 * Extra schema logic to layer on top of NgxMatCronSelectComponent's own periodicStepForm rules, passed
 * to createPeriodicStepsSchema(). `fields` targets one or more specific step selects; `form` receives the
 * whole schema.
 */
export interface IPeriodicStepsSchemaCustomization {
  fields?: Partial<Record<keyof IPeriodicStepsFormGroupValue, SchemaOrSchemaFn<number>>>;
  form?: SchemaOrSchemaFn<IPeriodicStepsFormGroupValue>;
}
