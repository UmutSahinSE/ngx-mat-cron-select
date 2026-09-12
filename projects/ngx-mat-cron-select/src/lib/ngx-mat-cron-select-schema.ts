import { apply, disabled, SchemaFn, validate } from '@angular/forms/signals';
import type { NgxMatCronSelectComponent } from './ngx-mat-cron-select.component';
import {
  IEveryCheckboxesFormGroupValue,
  IEveryCheckboxesSchemaCustomization,
  IInputsFormGroup,
  IInputsSchemaCustomization,
} from './ngx-mat-cron-select.interface';

export const inputFields = [
  'minute',
  'hour',
  'dayOfMonth',
  'monthOfYear',
  'dayOfWeek',
] as const satisfies (keyof IInputsFormGroup)[number][];
export const repeatingCheckboxFields = [
  'minute',
  'hour',
  'day',
  'monthOfYear',
] as const satisfies (keyof IEveryCheckboxesFormGroupValue)[number][];

type TInputsSchemaSource = Pick<NgxMatCronSelectComponent, 'getInputFieldValidator' | 'isInputFieldDisabled'>;
type TRepeatingCheckboxesSchemaSource = Pick<NgxMatCronSelectComponent, 'isRepeatingCheckboxFieldDisabled'>;

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

/** Same as createInputsSchema, but reusing an instance's repeatingCheckboxForm disabling rules. */
export function createRepeatingCheckboxesSchema(
  getCronSelect: () => TRepeatingCheckboxesSchemaSource | undefined,
  customization?: IEveryCheckboxesSchemaCustomization,
): SchemaFn<IEveryCheckboxesFormGroupValue> {
  return (schema) => {
    for (const fieldName of repeatingCheckboxFields) {
      disabled(schema[fieldName], {
        when: () => getCronSelect()?.isRepeatingCheckboxFieldDisabled(fieldName)() ?? false,
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
