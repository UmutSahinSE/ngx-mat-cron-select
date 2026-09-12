[Demo](https://stackblitz.com/~/github.com/UmutSahinSE/ngx-mat-cron-select-playground?file=package.json:L31-L37)

## Features

- Provides an interface for cron digits to be set as single or multiple values.
- Only the 5 digit Unix/Linux syntax is allowed.
- As digit values, ranges (2-5) are <b>not</b> supported, but lists (1,5,10) and steps (\*/15) are allowed. Checking
  a field's periodic checkbox hides its value select and shows a step select instead, defaulting to `*`.
- Inputs individually can be forced to become single select.
- Has translation support.
- Uses the locale from Angular Material.

## Requirements

- Built with signals throughout (`input()`/`output()`/signal-forms) — works in a zoneless app, but doesn't require one
- Angular Material
- Angular Forms
- Rxjs

  | ngx-mat-cron-select Version | Angular Version |
  | --------------------------- | --------------- |
  | 1.0.0 - 1.0.4               | \>= 19          |
  | 1.1.0                       | \>= 22          |

## Inputs

| Name                         | Description                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialTab                   | Cron Select will open this tab by default if `initialValue` is `null`.                                                                                                                                                                                                                                          |
| initialValue                 | The cron expression (5-field Unix/Linux syntax) to initialize the dropdowns/checkboxes from, or `null` for none. See "Initial Value Provision Method 1" below.                                                                                                                                                  |
| inputsForm                   | A signal-forms `FieldTree<IInputsFormGroup>` which manages dropdowns. Defaults to one built internally, but can be overridden — see "Initial Value Provision Method 2" below before doing so, since the library's own validation/disabling won't apply to your own tree unless you reuse it as described there. |
| periodicCheckboxForm         | A signal-forms `FieldTree<IPeriodicCheckboxesFormGroupValue>` which manages "every X" checkboxes. See "Overriding periodicCheckboxForm" below before providing your own.                                                                                                                                        |
| periodicStepForm             | A signal-forms `FieldTree<IPeriodicStepsFormGroupValue>` which manages each checked field's step (`*` vs. `*/N`). See "Overriding periodicStepForm" below before providing your own.                                                                                                                            |
| periodicCheckboxesVisibility | Determines which dropdowns should have checkboxes included.                                                                                                                                                                                                                                                     |
| isDisabled                   | Disables all inputs.                                                                                                                                                                                                                                                                                            |
| visibleTabs                  | Determines which tabs are visible. If only one of them is selected, tabs will be hidden.                                                                                                                                                                                                                        |

## Outputs

| Name        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| valueChange | Emits the current cron expression string whenever it changes. |

## Other Public Members

| Member             | Description                                                                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`            | A readonly `Signal<string \| null>` holding the current cron expression — the same value `valueChange` emits, readable directly (e.g. via a template reference variable) without subscribing to changes. |
| `setTab(tabIndex)` | Programmatically selects a tab. `tabIndex` is an index into the currently _visible_ tabs, in `hour, day, week, month, year` order.                                                                       |

## Initial Value Provision Method 1 - Providing a Cron Expression using initialValue

The simpler of the two ways to provide a value: bind `initialValue` to a plain cron expression string, and listen to `valueChange` for updates.

```ts
@Component({
  /* ... */
})
export class AppComponent {
  public cronExpression: string | null = '1 * 3 * *';
}
```

```html
<ngx-mat-cron-select [initialValue]="cronExpression" (valueChange)="cronExpression = $event"></ngx-mat-cron-select>
```

## Initial Value Provision Method 2 - Providing an inputsForm

A more advanced way to provide (and read) values: build your own `inputsForm` — a signal-forms `FieldTree<IInputsFormGroup>` — and bind it directly. **`initialValue` is not used in this solution**; the initial values come entirely from whatever model you construct `inputsForm` from.

By default, `inputsForm` is built internally with validation (required-when-active, range-checked) and disabling (based on the selected tab, `isDisabled`, and the "every X" checkboxes) already wired in. If you provide your own tree instead, **that validation and disabling is not applied automatically**. To reuse the library's rules on your own tree, `ngx-mat-cron-select` exports `createInputsSchema(getCronSelect, customization?)` — the same schema-builder function `NgxMatCronSelectComponent` uses internally to build its own default `inputsForm`, so there's a single source of truth for these rules rather than a copy for consumers to fall out of sync with. Both examples below use it.

### Example 1: a native signal-forms model

```ts
@Component({
  /* ... */
})
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly inputsModel = signal<IInputsFormGroup>({
    dayOfMonth: [3],
    dayOfWeek: [],
    hour: [],
    minute: [1],
    monthOfYear: [],
  });

  public readonly inputsForm = form(
    this.inputsModel,
    createInputsSchema(() => this.cronSelect()),
  );
}
```

```html
<ngx-mat-cron-select #cronSelect [inputsForm]="inputsForm"></ngx-mat-cron-select>
```

### Example 2: classic reactive-forms FormControls, bridged via compatForm()

```ts
@Component({
  /* ... */
})
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly dayOfMonthControl = new FormControl<number[]>([3], { nonNullable: true });
  private readonly dayOfWeekControl = new FormControl<number[]>([], { nonNullable: true });
  private readonly hourControl = new FormControl<number[]>([], { nonNullable: true });
  private readonly minuteControl = new FormControl<number[]>([1], { nonNullable: true });
  private readonly monthOfYearControl = new FormControl<number[]>([], { nonNullable: true });

  public readonly inputsForm = compatForm(
    signal<ICompatInputsFormGroup>({
      dayOfMonth: this.dayOfMonthControl,
      dayOfWeek: this.dayOfWeekControl,
      hour: this.hourControl,
      minute: this.minuteControl,
      monthOfYear: this.monthOfYearControl,
    }),
    createInputsSchema(() => this.cronSelect()) as unknown as SchemaFn<ICompatInputsFormGroup>,
  ) as unknown as FieldTree<IInputsFormGroup>;
}
```

```html
<ngx-mat-cron-select #cronSelect [inputsForm]="inputsForm"></ngx-mat-cron-select>
```

`compatForm()`'s model type (`ICompatInputsFormGroup`, `FormControl`-backed fields) is genuinely different from `inputsForm`'s own type (`IInputsFormGroup`, raw-value fields) — the resulting `FieldTree`'s root value type differs structurally, which TypeScript can't unify even though every actual field read/write works correctly either way, since compat's per-field reads already unwrap to the same raw values. The casts above are scoped to this one construction site instead of reaching for `$any()` in the template.

### Notes common to both examples

Note the template reference variable (`#cronSelect`) matching the string passed to `viewChild()` — this is what lets `viewChild()` resolve to this _specific_ `ngx-mat-cron-select` instance rather than ambiguously matching the first one of that type in the view, which matters if you have more than one on the page (as the demo does).

`createInputsSchema`'s rules depend on the component instance's own reactive state (in particular, which tab is currently selected), so they only exist once the `ngx-mat-cron-select` instance has been created — normally after `viewChild()` resolves, which happens later than when you construct `inputsForm` as a class property. That's why `getCronSelect` is a function (`() => this.cronSelect()`) rather than the instance itself: `createInputsSchema` calls it lazily, every time its internal `validate()`/`disabled()` logic re-evaluates, so it correctly picks up the instance as soon as it exists and keeps reacting to its tab changes from then on.

`createInputsSchema` also accepts an optional second argument to layer your own rules on top of the library's, targeting one or more specific fields, the whole form (e.g. for cross-field rules), or both:

```ts
createInputsSchema(() => this.cronSelect(), {
  fields: {
    dayOfMonth: (fieldSchema) =>
      validate(fieldSchema, ({ value }) => (value().includes(31) ? { kind: 'day31NotAllowed' } : null)),
  },
  form: (schema) => {
    /* whole-schema logic, e.g. cross-field validation via validateTree */
  },
});
```

## Overriding periodicCheckboxForm

Like `inputsForm` above, `periodicCheckboxForm` is built internally with disabling (based on the selected tab, `isDisabled`, and `periodicCheckboxesVisibility`) already wired in. If you provide your own tree instead, that disabling is not applied automatically either — reuse it with `createPeriodicCheckboxesSchema(getCronSelect, customization?)`, the `periodicCheckboxForm` counterpart to `createInputsSchema` above (same lazy-`viewChild()` reasoning, and the same optional `customization` argument applies):

```ts
@Component({
  /* ... */
})
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly periodicCheckboxesModel = signal<IPeriodicCheckboxesFormGroupValue>({
    day: false,
    hour: false,
    minute: false,
    monthOfYear: false,
  });

  public readonly periodicCheckboxForm = form(
    this.periodicCheckboxesModel,
    createPeriodicCheckboxesSchema(() => this.cronSelect()),
  );
}
```

```html
<ngx-mat-cron-select #cronSelect [periodicCheckboxForm]="periodicCheckboxForm"></ngx-mat-cron-select>
```

`periodicCheckboxForm` can equally be built via `compatForm()`, bridging classic checkbox `FormControl<boolean>`s, the same way `inputsForm`'s Example 2 above does.

## Overriding periodicStepForm

`periodicStepForm` holds the step (`1` meaning `*`, or `N > 1` meaning `*/N`) for each checked periodic field. Like `periodicCheckboxForm`, it's built internally with disabling wired in (the same conditions as its matching checkbox), reusable via `createPeriodicStepsSchema(getCronSelect, customization?)`:

```ts
@Component({
  /* ... */
})
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly periodicStepsModel = signal<IPeriodicStepsFormGroupValue>({
    day: 1,
    hour: 1,
    minute: 1,
    monthOfYear: 1,
  });

  public readonly periodicStepForm = form(
    this.periodicStepsModel,
    createPeriodicStepsSchema(() => this.cronSelect()),
  );
}
```

```html
<ngx-mat-cron-select #cronSelect [periodicStepForm]="periodicStepForm"></ngx-mat-cron-select>
```

## Injection Tokens

| Name                                        | Description                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| MAT_DATE_LOCALE (From Angular Material)     | Determines the locale.                                                         |
| NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR          | Determines whether 12 or 24 hour format should be used.                        |
| NGX_MAT_CRON_SELECT_WEEK_FORMAT             | Determines how the days of week are displayed in dropdown.                     |
| NGX_MAT_CRON_SELECT_MONTH_FORMAT            | Determines how the months are displayed in dropdown.                           |
| NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE       | Explained in Translation section.                                              |
| NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED | Disables the tab-switch animation when `true`. Defaults to `false` (animated). |

## Translation

NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE needs to be provided to enable translations. Both @ngx-translate and custom translations are supported.

### @ngx-translate Setup

```
    {
      provide: NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE,
      useExisting: TranslateService,
    },
```

### Custom Translation Setup

The first parameter contains translations. It only expects an observable value, so if the translation values are not expected to change, the static value can be passed inside of() like in the example.

The second parameter determines the current language. It only expects an observable value, so if the language is not expected to change, the static value can be passed inside of() like in the example.

```
  provideNMCSTranslations(
      of({
        en: {
            dayOfMonthSelectLabel: 'Select days',
            dayOfWeekSelectLabel: 'Select days of week',
            hourSelectLabel: 'Select hours',
            minuteSelectLabel: 'Select minutes',
            monthSelectLabel: 'Select months',
            periodicDayStepLabel: 'Every {{n}} days',
            periodicHourStepLabel: 'Every {{n}} hours',
            periodicMinuteStepLabel: 'Every {{n}} minutes',
            periodicMonthStepLabel: 'Every {{n}} months',
            periodicStepLabelOverrides: {
              day: { 1: 'Every day', 2: 'Every other day' },
              hour: { 1: 'Every hour', 2: 'Every other hour' },
              minute: { 1: 'Every minute', 2: 'Every other minute' },
              month: { 1: 'Every month', 2: 'Every other month' },
            },
            tabLabelDay: 'Day',
            tabLabelHour: 'Hour',
            tabLabelMonth: 'Month',
            tabLabelWeek: 'Week',
            tabLabelYear: 'Year',
        },
      }),
      of('en'),
    ),

```

### Step select labels (periodic\<Unit>StepLabel)

Once a periodic checkbox is checked, its step select shows one option per step count, and the checkbox's own
resting label is just that step select's step-1 option — there's no separate "every X" key to keep in sync with
it. Every option's text is built the same way, for every step number including 1: an optional
`periodic{Minute,Hour,Day,Month}StepLabel` template, with `{{n}}` replaced by the step number — e.g.
`periodicDayStepLabel: 'Every {{n}} days'` renders "Every 3 days" for step 3. When not provided, the library falls
back to its own built-in English `'Every {{n}} <unit>'` template.

"Every Nth" phrasing isn't a simple number substitution in every language — the step-1 case in English reads
"Every Day", not "Every 1 days", and the step-2 case reads "Every other day", not "Every 2 days" — while Turkish's
generic template ("{{n}} günde bir") already reads naturally for every `n`, 1 and 2 included. To handle this, a
specific translation for one exact number is tried before the generic template. The library ships these
exceptions itself as built-in defaults — `day`/`1` renders "Every Day" and `day`/`2` renders "Every other day",
even with no translation configured at all — as an example of the mechanism a consumer can use for their own
language's irregular cases:

- With `NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE` backed by `provideNMCSTranslations`, add exceptions under
  `periodicStepLabelOverrides` (this is exactly how the built-in English defaults above are expressed internally):
  ```ts
  periodicStepLabelOverrides: {
    day: { 1: 'Every day', 2: 'Every other day' },
  },
  ```
- With `@ngx-translate`, define the exception as a literal key suffixed with the number, e.g.
  `ngxMatCronSelect.periodicDayStepLabel_2: 'Every other day'`, alongside the generic
  `ngxMatCronSelect.periodicDayStepLabel: 'Every {{n}} days'`.

Either way, a number with no override (e.g. 3) falls through to the generic template. Providing your own `day`/`1`
or `day`/`2` override (via either mechanism above) replaces the built-in default, the same as any other
translation key.
