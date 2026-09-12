import { apply, disabled, SchemaFn, validate } from '@angular/forms/signals';
import type { NgxMatCronSelectComponent } from './ngx-mat-cron-select.component';
import {
  IInputsFormGroup,
  IInputsSchemaCustomization,
  IPeriodicCheckboxesFormGroupValue,
  IPeriodicCheckboxesSchemaCustomization,
  IPeriodicStepsFormGroupValue,
  IPeriodicStepsSchemaCustomization,
} from './ngx-mat-cron-select.interface';

export const inputFields = [
  'minute',
  'hour',
  'dayOfMonth',
  'monthOfYear',
  'dayOfWeek',
] as const satisfies (keyof IInputsFormGroup)[number][];
export const periodicCheckboxFields = [
  'minute',
  'hour',
  'day',
  'monthOfYear',
] as const satisfies (keyof IPeriodicCheckboxesFormGroupValue)[number][];

type TInputsSchemaSource = Pick<NgxMatCronSelectComponent, 'getInputFieldValidator' | 'isInputFieldDisabled'>;
type TPeriodicCheckboxesSchemaSource = Pick<NgxMatCronSelectComponent, 'isPeriodicCheckboxFieldDisabled'>;

/**
 * Builds a schema function that reuses an `NgxMatCronSelectComponent` instance's own `inputsForm`
 * validation (required-when-active + range check) and tab-based disabling on a tree you build yourself (e.g.
 * via `form()` or `compatForm()`), optionally layering extra rules of your own via `customization`.
 *
 * Those rules depend on the component instance's own reactive state (selected tab), and a tree you build as a
 * class property is normally constructed before that instance exists — e.g. it's obtained via Angular's
 * `viewChild()`, which only resolves once the view has rendered. `getCronSelect` is therefore called lazily on
 * every reactive re-evaluation (inside the validate()/disabled() logic this returns), not once up front, so
 * pass a function such as `() => this.cronSelect()` rather than a resolved instance.
 */
export function createInputsSchema(
  getCronSelect: () => TInputsSchemaSource | undefined,
  customization?: IInputsSchemaCustomization,
): SchemaFn<IInputsFormGroup> {
  return (schema) => {
    for (const fieldName of inputFields) {
      validate(schema[fieldName], (ctx) => getCronSelect()?.getInputFieldValidator(fieldName)(ctx) ?? null);
      disabled(schema[fieldName], { when: () => getCronSelect()?.isInputFieldDisabled(fieldName)() ?? false });

      const fieldCustomization = customization?.fields?.[fieldName];

      if (fieldCustomization) {
        apply(schema[fieldName], fieldCustomization);
      }
    }

    if (customization?.form) {
      apply(schema, customization.form);
    }
  };
}

/** Same as createInputsSchema, but reusing an instance's periodicCheckboxForm disabling rules. */
export function createPeriodicCheckboxesSchema(
  getCronSelect: () => TPeriodicCheckboxesSchemaSource | undefined,
  customization?: IPeriodicCheckboxesSchemaCustomization,
): SchemaFn<IPeriodicCheckboxesFormGroupValue> {
  return (schema) => {
    for (const fieldName of periodicCheckboxFields) {
      disabled(schema[fieldName], {
        when: () => getCronSelect()?.isPeriodicCheckboxFieldDisabled(fieldName)() ?? false,
      });

      const fieldCustomization = customization?.fields?.[fieldName];

      if (fieldCustomization) {
        apply(schema[fieldName], fieldCustomization);
      }
    }

    if (customization?.form) {
      apply(schema, customization.form);
    }
  };
}

/**
 * Same as createPeriodicCheckboxesSchema, but for `periodicStepForm` — reuses the exact same
 * `isPeriodicCheckboxFieldDisabled` disabling rules as the checkbox each step select belongs to (tab-inactive,
 * `isDisabled`, or hidden via visibility all disable the pair together).
 */
export function createPeriodicStepsSchema(
  getCronSelect: () => TPeriodicCheckboxesSchemaSource | undefined,
  customization?: IPeriodicStepsSchemaCustomization,
): SchemaFn<IPeriodicStepsFormGroupValue> {
  return (schema) => {
    for (const fieldName of periodicCheckboxFields) {
      disabled(schema[fieldName], {
        when: () => getCronSelect()?.isPeriodicCheckboxFieldDisabled(fieldName)() ?? false,
      });

      const fieldCustomization = customization?.fields?.[fieldName];

      if (fieldCustomization) {
        apply(schema[fieldName], fieldCustomization);
      }
    }

    if (customization?.form) {
      apply(schema, customization.form);
    }
  };
}
