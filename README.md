## Features

- Provides an interface for cron digits to be set as single or multiple values.
- Only the 5 digit Unix/Linux syntax is allowed.
- As digit values, ranges (2-5) and steps (\*/15) are <b>not</b> supported but lists (1,5,10) are allowed.
- Inputs individually can be forced to become single select.
- Has translation.
- Uses the locale from Angular Material.

## Requirements

- Angular >= 19
- Angular Material
- Angular Forms
- Rxjs

## Inputs

| Name                      | Description                                                                                                                                                                                                                     |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| initialTab                | Cron Select will open this tab by default if formControl value is set as null.                                                                                                                                                  |
| inputsFormGroup           | FormGroup which manages dropdowns. For multiselect values, new FormControl<number[]> should be defined. For single selection, new FormControl<number \| null> should be used. Form controls should include Validators.required. |
| everyCheckboxesFormGroup  | FormGroup which manages checkboxes.                                                                                                                                                                                             |
| everyCheckboxesVisibility | Determines which dropdowns should have checkboxes included.                                                                                                                                                                     |
| isDisabled                | Disables all inputs.                                                                                                                                                                                                            |
| visibleTabs               | Determines which tabs are visible. If only one of them is selected, tabs will be hidden.                                                                                                                                        |

## Outputs

| Name        | Description                  |
|-------------|------------------------------|
| valueChange | Emits value on value change. |

## Injection Tokens

| Name                                    | Description                                                |
|-----------------------------------------|------------------------------------------------------------|
| MAT_DATE_LOCALE (From Angular Material) | Determines the locale.                                     |
| NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR      | Determines whether 12 or 24 hour format should be used.    |
| NGX_MAT_CRON_SELECT_WEEK_FORMAT         | Determines how the days of week are displayed in dropdown. |
| NGX_MAT_CRON_SELECT_MONTH_FORMAT        | Determines how the months are displayed in dropdown.       |
| NGX_MAT_CRON_SELECT_TRANSLATE_SERVICE   | Explained in Translation section.                          |

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
          tabLabelDay: 'Hour',
          tabLabelHour: 'Day',
          tabLabelMonth: 'Month',
          tabLabelWeek: 'Week',
          tabLabelYear: 'Year',
        },
      }),
      of('en'),
    ),

```
