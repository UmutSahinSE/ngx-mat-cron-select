[Demo](https://stackblitz.com/~/github.com/UmutSahinSE/ngx-mat-cron-select-playground?file=package.json:L31-L37)

## Features

- Provides an interface for cron digits to be set as single or multiple values.
- Only the 5 digit Unix/Linux syntax is allowed.
- As digit values, ranges (2-5) and steps (\*/15) are <b>not</b> supported but lists (1,5,10) are allowed.
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

| Name                          | Description                                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initialTab                    | Cron Select will open this tab by default if `initialValue` is `null`.                                                                                                                                                                                          |
| initialValue                  | The cron expression (5-field Unix/Linux syntax) to initialize the dropdowns/checkboxes from, or `null` for none. See "Initial Value Provision Method 1" below.                                                                        |
| inputsForm                    | A signal-forms `FieldTree<IInputsFormGroup>` which manages dropdowns. Defaults to one built internally, but can be overridden — see "Initial Value Provision Method 2" below before doing so, since the library's own validation/disabling won't apply to your own tree unless you reuse it as described there. |
| repeatingCheckboxForm         | A signal-forms `FieldTree<IEveryCheckboxesFormGroupValue>` which manages "every X" checkboxes. See "Overriding repeatingCheckboxForm" below before providing your own.                                                                                                             |
| repeatingCheckboxesVisibility | Determines which dropdowns should have checkboxes included.                                                                                                                                                                                                     |
| isDisabled                    | Disables all inputs.                                                                                                                                                                                                                                             |
| visibleTabs                   | Determines which tabs are visible. If only one of them is selected, tabs will be hidden.                                                                                                                                                                        |

## Outputs

| Name        | Description                                                          |
| ----------- | ---------------------------------------------------------------------- |
| valueChange | Emits the current cron expression string whenever it changes.        |

## Other Public Members

| Member              | Description                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `value`              | A readonly `Signal<string \| null>` holding the current cron expression — the same value `valueChange` emits, readable directly (e.g. via a template reference variable) without subscribing to changes. |
| `setTab(tabIndex)`   | Programmatically selects a tab. `tabIndex` is an index into the currently *visible* tabs, in `hour, day, week, month, year` order. |

## Initial Value Provision Method 1 - Providing a Cron Expression using initialValue

The simpler of the two ways to provide a value: bind `initialValue` to a plain cron expression string, and listen to `valueChange` for updates.

```ts
@Component({ /* ... */ })
export class AppComponent {
  public cronExpression: string | null = '1 * 3 * *';
}
```

```html
<ngx-mat-cron-select
  [initialValue]="cronExpression"
  (valueChange)="cronExpression = $event"
></ngx-mat-cron-select>
```

## Initial Value Provision Method 2 - Providing an inputsForm

A more advanced way to provide (and read) values: build your own `inputsForm` — a signal-forms `FieldTree<IInputsFormGroup>` — and bind it directly. **`initialValue` is not used in this solution**; the initial values come entirely from whatever model you construct `inputsForm` from.

By default, `inputsForm` is built internally with validation (required-when-active, range-checked) and disabling (based on the selected tab, `isDisabled`, and the "every X" checkboxes) already wired in. If you provide your own tree instead, **that validation and disabling is not applied automatically**. To reuse the library's rules on your own tree, `ngx-mat-cron-select` exports `createInputsSchema(getCronSelect, customization?)` — the same schema-builder function `NgxMatCronSelectComponent` uses internally to build its own default `inputsForm`, so there's a single source of truth for these rules rather than a copy for consumers to fall out of sync with. Both examples below use it.

### Example 1: a native signal-forms model

```ts
@Component({ /* ... */ })
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly inputsModel = signal<IInputsFormGroup>({
    dayOfMonth: [3],
    dayOfWeek: [],
    hour: [],
    minute: [1],
    monthOfYear: [],
  });

  public readonly inputsForm = form(this.inputsModel, createInputsSchema(() => this.cronSelect()));
}
```

```html
<ngx-mat-cron-select #cronSelect [inputsForm]="inputsForm"></ngx-mat-cron-select>
```

### Example 2: classic reactive-forms FormControls, bridged via compatForm()

```ts
@Component({ /* ... */ })
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

Note the template reference variable (`#cronSelect`) matching the string passed to `viewChild()` — this is what lets `viewChild()` resolve to this *specific* `ngx-mat-cron-select` instance rather than ambiguously matching the first one of that type in the view, which matters if you have more than one on the page (as the demo does).

`createInputsSchema`'s rules depend on the component instance's own reactive state (in particular, which tab is currently selected), so they only exist once the `ngx-mat-cron-select` instance has been created — normally after `viewChild()` resolves, which happens later than when you construct `inputsForm` as a class property. That's why `getCronSelect` is a function (`() => this.cronSelect()`) rather than the instance itself: `createInputsSchema` calls it lazily, every time its internal `validate()`/`disabled()` logic re-evaluates, so it correctly picks up the instance as soon as it exists and keeps reacting to its tab changes from then on.

`createInputsSchema` also accepts an optional second argument to layer your own rules on top of the library's, targeting one or more specific fields, the whole form (e.g. for cross-field rules), or both:

```ts
createInputsSchema(() => this.cronSelect(), {
  fields: {
    dayOfMonth: (fieldSchema) => validate(fieldSchema, ({ value }) => (value().includes(31) ? { kind: 'day31NotAllowed' } : null)),
  },
  form: (schema) => {
    /* whole-schema logic, e.g. cross-field validation via validateTree */
  },
});
```

## Overriding repeatingCheckboxForm

Like `inputsForm` above, `repeatingCheckboxForm` is built internally with disabling (based on the selected tab, `isDisabled`, and `repeatingCheckboxesVisibility`) already wired in. If you provide your own tree instead, that disabling is not applied automatically either — reuse it with `createRepeatingCheckboxesSchema(getCronSelect, customization?)`, the `repeatingCheckboxForm` counterpart to `createInputsSchema` above (same lazy-`viewChild()` reasoning, and the same optional `customization` argument applies):

```ts
@Component({ /* ... */ })
export class AppComponent {
  protected readonly cronSelect = viewChild<NgxMatCronSelectComponent>('cronSelect');

  private readonly everyCheckboxesModel = signal<IEveryCheckboxesFormGroupValue>({
    day: false,
    hour: false,
    minute: false,
    monthOfYear: false,
  });

  public readonly repeatingCheckboxForm = form(
    this.everyCheckboxesModel,
    createRepeatingCheckboxesSchema(() => this.cronSelect()),
  );
}
```

```html
<ngx-mat-cron-select #cronSelect [repeatingCheckboxForm]="repeatingCheckboxForm"></ngx-mat-cron-select>
```

`repeatingCheckboxForm` can equally be built via `compatForm()`, bridging classic checkbox `FormControl<boolean>`s, the same way `inputsForm`'s Example 2 above does.

## Injection Tokens

| Name                                       | Description                                                     |
| -------------------------------------------- | ------------------------------------------------------------------ |
| MAT_DATE_LOCALE (From Angular Material)     | Determines the locale.                                          |
| NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR          | Determines whether 12 or 24 hour format should be used.         |
| NGX_MAT_CRON_SELECT_WEEK_FORMAT             | Determines how the days of week are displayed in dropdown.      |
| NGX_MAT_CRON_SELECT_MONTH_FORMAT            | Determines how the months are displayed in dropdown.            |
| NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE       | Explained in Translation section.                                |
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
          everyDayLabel: 'Every Day',
          everyHourLabel: 'Every Hour',
          everyMinuteLabel: 'Every Minute',
          everyMonthLabel: 'Every Month',
          hourSelectLabel: 'Select hours',
          minuteSelectLabel: 'Select minutes',
          monthSelectLabel: 'Select months',
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
