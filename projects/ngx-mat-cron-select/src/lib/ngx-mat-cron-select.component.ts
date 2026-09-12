import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, InputSignal, output, Signal, signal } from '@angular/core';
import { untracked } from '@angular/core/primitives/signals';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldTree, FieldValidator, form } from '@angular/forms/signals';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { NmcsDayOfMonthSelectComponent } from '../input-components/nmcs-day-of-month-select/nmcs-day-of-month-select.component';
import { NmcsDayOfWeekSelectComponent } from '../input-components/nmcs-day-of-week-select/nmcs-day-of-week-select.component';
import { NmcsHourSelectComponent } from '../input-components/nmcs-hour-select/nmcs-hour-select.component';
import { TNmcsValue } from '../input-components/nmcs-input.interface';
import { NmcsMinuteSelectComponent } from '../input-components/nmcs-minute-select/nmcs-minute-select.component';
import { NmcsMonthOfYearSelectComponent } from '../input-components/nmcs-month-of-year-select/nmcs-month-of-year-select.component';
import { NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED } from '../tokens';
import { TranslateOrUseDefaultPipe } from '../translate-or-use-default.pipe';
import {
  createInputsSchema,
  createRepeatingCheckboxesSchema,
  inputFields,
  repeatingCheckboxFields,
} from './ngx-mat-cron-select-schema';
import { IEveryCheckboxesFormGroupValue, IInputsFormGroup, ITab } from './ngx-mat-cron-select.interface';

const inputFieldRanges: Record<(typeof inputFields)[number], readonly [number, number]> = {
  dayOfMonth: [1, 31],
  dayOfWeek: [0, 6],
  hour: [0, 23],
  minute: [0, 59],
  monthOfYear: [0, 11],
};

@Component({
  imports: [
    MatTabGroup,
    MatTab,
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatTimepickerModule,
    MatFormFieldModule,
    TranslateOrUseDefaultPipe,
    NmcsHourSelectComponent,
    NmcsMinuteSelectComponent,
    NmcsDayOfWeekSelectComponent,
    NmcsMonthOfYearSelectComponent,
    NmcsDayOfMonthSelectComponent,
    AsyncPipe,
  ],
  selector: 'ngx-mat-cron-select',
  styleUrls: ['./ngx-mat-cron-select.component.scss'],
  templateUrl: './ngx-mat-cron-select.component.html',
})
export class NgxMatCronSelectComponent {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly areTabAnimationsDisabled = inject(NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED, {
    optional: true,
  });
  protected readonly tabAnimationDuration = this.areTabAnimationsDisabled ? '0ms' : '500ms';

  public readonly initialTab = input<keyof ITab>('year');
  private readonly inputsModel = signal<IInputsFormGroup>({
    dayOfMonth: [],
    dayOfWeek: [],
    hour: [],
    minute: [],
    monthOfYear: [],
  });

  private readonly repeatingCheckboxesModel = signal<IEveryCheckboxesFormGroupValue>({
    day: false,
    hour: false,
    minute: false,
    monthOfYear: false,
  });

  public readonly repeatingCheckboxesVisibility = input<IEveryCheckboxesFormGroupValue>({
    day: true,
    hour: true,
    minute: true,
    monthOfYear: true,
  });

  public readonly initialValue = input<string | null>(null);
  public readonly isDisabled = input<boolean>(false);
  public readonly visibleTabs = input<ITab>({
    day: true,
    hour: true,
    month: true,
    week: true,
    year: true,
  });

  public readonly valueChange = output<string | null>();
  protected readonly effectiveVisibleTabs = computed(() => {
    const areAnyTabsVisible = Object.values(this.visibleTabs()).some(Boolean);

    return areAnyTabsVisible ? this.visibleTabs() : { ...this.visibleTabs(), hour: true };
  });
  protected readonly isThereASingleVisibleTab = computed(() => {
    return Object.values(this.effectiveVisibleTabs()).filter(Boolean).length === 1;
  });
  protected readonly manuallySelectedTab = signal<keyof ITab | null>(null);
  protected readonly selectedTab: Signal<keyof ITab> = computed(() => this.getSelectedTab(), { equal: () => false });

  protected readonly selectedTabIndex = computed(() => {
    const index = (['hour', 'day', 'week', 'month', 'year'] as (keyof ITab)[])
      .filter((tabName) => this.effectiveVisibleTabs()[tabName])
      .indexOf(this.selectedTab());

    return index === -1 ? 0 : index;
  });

  protected readonly monthAndDayOrder: ('day' | 'month')[] = this.getMonthAndDayOrder();

  private readonly initializationChecklist = {
    determiningTab: signal<symbol | null>(null),
    disablingInputs: {
      dayOfMonth: signal<symbol | null>(null),
      dayOfWeek: signal<symbol | null>(null),
      hour: signal<symbol | null>(null),
      minute: signal<symbol | null>(null),
      monthOfYear: signal<symbol | null>(null),
    },
    disablingRepeatingCheckbox: {
      day: signal<symbol | null>(null),
      hour: signal<symbol | null>(null),
      minute: signal<symbol | null>(null),
      monthOfYear: signal<symbol | null>(null),
    },
    initializationDone: signal<symbol | null>(null),
    settingSymbol: signal<symbol | null>(null),
  } as const;

  private readonly isRepeatingCheckboxAvailabilitySettled = computed(() => {
    const disabledStatuses = [
      this.initializationChecklist.disablingRepeatingCheckbox.day(),
      this.initializationChecklist.disablingRepeatingCheckbox.hour(),
      this.initializationChecklist.disablingRepeatingCheckbox.minute(),
      this.initializationChecklist.disablingRepeatingCheckbox.monthOfYear(),
    ];

    return disabledStatuses.every((status) => status === this.initializationChecklist.settingSymbol());
  });

  private readonly isInputDisabled = {
    dayOfMonth: this.getIsInputDisabled('dayOfMonth'),
    dayOfWeek: this.getIsInputDisabled('dayOfWeek'),
    hour: this.getIsInputDisabled('hour'),
    minute: this.getIsInputDisabled('minute'),
    monthOfYear: this.getIsInputDisabled('monthOfYear'),
  } as const;

  private readonly isCheckboxDisabled = {
    day: this.getIsRepeatingCheckboxDisabled('day'),
    hour: this.getIsRepeatingCheckboxDisabled('hour'),
    minute: this.getIsRepeatingCheckboxDisabled('minute'),
    monthOfYear: this.getIsRepeatingCheckboxDisabled('monthOfYear'),
  } as const;

  public readonly repeatingCheckboxForm: InputSignal<FieldTree<IEveryCheckboxesFormGroupValue>> = input(
    form(
      this.repeatingCheckboxesModel,
      createRepeatingCheckboxesSchema(() => this),
    ),
  );

  public readonly inputsForm: InputSignal<FieldTree<IInputsFormGroup>> = input(
    form(
      this.inputsModel,
      createInputsSchema(() => this),
    ),
  );

  /** The disabled-state signal this component uses for a given `inputsForm` field. See getInputFieldValidator. */
  public isInputFieldDisabled(fieldName: keyof IInputsFormGroup): Signal<boolean> {
    return this.isInputDisabled[fieldName];
  }

  /** The disabled-state signal this component uses for a given `repeatingCheckboxForm` field. See getInputFieldValidator. */
  public isRepeatingCheckboxFieldDisabled(fieldName: keyof IEveryCheckboxesFormGroupValue): Signal<boolean> {
    return this.isCheckboxDisabled[fieldName];
  }

  public readonly value = computed(() => {
    const formValues = Object.fromEntries(
      inputFields.map((fieldName) => [fieldName, this.inputsForm()[fieldName]().value()]),
    ) as unknown as IInputsFormGroup;
    const repeatingCheckboxValue = this.repeatingCheckboxForm()().controlValue();
    const activeCheckboxes = this.getActiveCheckboxesBasedOnActiveTab();

    if (!this.inputsForm()().valid()) {
      return Object.entries(repeatingCheckboxValue)
        .filter(
          ([inputName]) =>
            activeCheckboxes[repeatingCheckboxFields.indexOf(inputName as keyof IEveryCheckboxesFormGroupValue)],
        )
        .every(([_, checkboxValue]) => checkboxValue)
        ? '* * * * *'
        : null;
    }

    return this.getActiveInputsBasedOnActiveTab()
      .map((isActive, index) => {
        const fieldName = inputFields[index];
        const checkboxName = this.getCheckboxName(fieldName);

        if (
          !isActive ||
          !activeCheckboxes[repeatingCheckboxFields.indexOf(checkboxName)] ||
          repeatingCheckboxValue[checkboxName]
        ) {
          return '*';
        }

        return Array.isArray(formValues[fieldName])
          ? [...formValues[fieldName]].sort((a, b) => a - b).join(',')
          : formValues[fieldName];
      })
      .join(' ');
  });

  private previousValue: string | null = null;
  private previousActiveCheckboxes: readonly boolean[] | null = null;
  private previousInputsForm: FieldTree<IInputsFormGroup> | undefined = undefined;
  private previousRepeatingCheckboxForm: FieldTree<IEveryCheckboxesFormGroupValue> | undefined = undefined;

  constructor() {
    this.registerFormControlInitialization();
    this.registerOnChangeCall();
    this.registerCheckboxAutoCheckOnTabSwitch();
  }

  public setTab(tabIndex: number): void {
    const tabs: (keyof ITab)[] = ['hour', 'day', 'week', 'month', 'year'];
    const visibleTabs = tabs.filter((tabName) => this.effectiveVisibleTabs()[tabName]);
    this.manuallySelectedTab.set(visibleTabs[tabIndex]);
  }

  private registerOnChangeCall(): void {
    effect(() => {
      if (this.initializationChecklist.settingSymbol() !== this.initializationChecklist.initializationDone()) {
        return;
      }

      const prevValue = this.previousValue;
      const newValue = this.value();
      this.previousValue = newValue;

      if (prevValue === newValue) {
        return;
      }

      this.valueChange.emit(newValue);
    });
  }

  private registerCheckboxAutoCheckOnTabSwitch(): void {
    effect(() => {
      if (this.initializationChecklist.settingSymbol() !== this.initializationChecklist.initializationDone()) {
        return;
      }

      const activeCheckboxes = this.getActiveCheckboxesBasedOnActiveTab();
      const { previousActiveCheckboxes } = this;
      this.previousActiveCheckboxes = activeCheckboxes;

      if (previousActiveCheckboxes === null) {
        return;
      }

      const repeatingCheckboxForm = this.repeatingCheckboxForm();

      repeatingCheckboxFields.forEach((fieldName, index) => {
        if (activeCheckboxes[index] && !previousActiveCheckboxes[index]) {
          repeatingCheckboxForm[fieldName]().value.set(true);
        }
      });
    });
  }

  private registerFormControlInitialization(): void {
    effect(() => {
      const initialValue = this.initialValue();
      const inputsForm = this.inputsForm();
      const repeatingCheckboxForm = this.repeatingCheckboxForm();

      const haveFormTreesBeenReassigned =
        inputsForm !== this.previousInputsForm || repeatingCheckboxForm !== this.previousRepeatingCheckboxForm;

      this.previousInputsForm = inputsForm;
      this.previousRepeatingCheckboxForm = repeatingCheckboxForm;

      const isInitialValueEchoingLastEmittedValue = untracked(
        () => this.initializationChecklist.initializationDone() !== null && initialValue === this.previousValue,
      );

      if (!haveFormTreesBeenReassigned && isInitialValueEchoingLastEmittedValue) {
        return;
      }

      this.previousActiveCheckboxes = null;
      this.initializationChecklist.settingSymbol.set(Symbol());
    });

    effect(() => {
      this.selectedTab();
      this.initializationChecklist.determiningTab.set(this.initializationChecklist.settingSymbol());
    });

    this.registerRepeatingCheckboxesDisable();
    this.registerInputDisable();

    effect(() => {
      const disabledStatuses = [
        this.initializationChecklist.disablingInputs.hour(),
        this.initializationChecklist.disablingInputs.minute(),
        this.initializationChecklist.disablingInputs.dayOfMonth(),
        this.initializationChecklist.disablingInputs.dayOfWeek(),
        this.initializationChecklist.disablingInputs.monthOfYear(),
      ];

      if (!disabledStatuses.every((status) => status === this.initializationChecklist.settingSymbol())) {
        return;
      }

      untracked(() => this.initialize());
      this.initializationChecklist.initializationDone.set(this.initializationChecklist.settingSymbol());
    });
  }

  private registerInputDisable(): void {
    for (const fieldName of inputFields) {
      effect(() => {
        if (!untracked(this.isRepeatingCheckboxAvailabilitySettled)) {
          return;
        }

        this.isInputDisabled[fieldName]();
        this.initializationChecklist.disablingInputs[fieldName].set(this.initializationChecklist.settingSymbol());
      });
    }
  }

  private registerRepeatingCheckboxesDisable(): void {
    for (const fieldName of repeatingCheckboxFields) {
      effect(() => {
        if (
          untracked(
            () => this.initializationChecklist.determiningTab() !== this.initializationChecklist.settingSymbol(),
          )
        ) {
          return;
        }

        this.isCheckboxDisabled[fieldName]();
        this.initializationChecklist.disablingRepeatingCheckbox[fieldName].set(
          this.initializationChecklist.settingSymbol(),
        );
      });
    }
  }

  private initialize(): void {
    const initialValue = this.validateInputCron(this.initialValue());
    const selectedTab = this.selectedTab();
    const inputsForm = this.inputsForm();
    const repeatingCheckboxForm = this.repeatingCheckboxForm();

    this.manuallySelectedTab.set(null);

    if (initialValue === null) {
      if (!inputsForm().valid()) {
        this.initializeWithoutStartingValue(inputsForm, repeatingCheckboxForm);
      }

      return;
    }

    this.setFormUsingInitialValue(initialValue, inputsForm, repeatingCheckboxForm, selectedTab);
  }

  private setFormUsingInitialValue(
    initialValue: string,
    inputsForm: FieldTree<IInputsFormGroup>,
    repeatingCheckboxForm: FieldTree<IEveryCheckboxesFormGroupValue>,
    selectedTab: keyof ITab,
  ): void {
    const split = initialValue.split(' ');
    const [minute, hour, dayOfMonth, monthOfYear, dayOfWeek] = split;
    const splitAsObject = { dayOfMonth, dayOfWeek, hour, minute, monthOfYear };

    for (const inputName of ['dayOfMonth', 'dayOfWeek', 'hour', 'minute', 'monthOfYear'] as const) {
      const formControlValue = this.convertCronInputToFormControlValue(splitAsObject[inputName], inputName);

      if (formControlValue !== undefined) {
        inputsForm[inputName]().reset(formControlValue);
      }
    }

    for (const [index, fieldValue] of split.entries()) {
      if (index === 2 || index === 4) {
        continue;
      }

      const checkboxName = this.getCheckboxName(inputFields[index]);
      repeatingCheckboxForm[checkboxName]().reset(fieldValue === '*');
    }

    const shouldCheckboxBeEnabledForDayOfMonth = ['month', 'year'].includes(selectedTab) && dayOfMonth === '*';
    const shouldCheckboxBeEnabledForDayOfWeek = selectedTab === 'week' && dayOfWeek === '*';

    repeatingCheckboxForm.day().reset(shouldCheckboxBeEnabledForDayOfMonth || shouldCheckboxBeEnabledForDayOfWeek);
  }

  private initializeWithoutStartingValue(
    inputsForm: FieldTree<IInputsFormGroup>,
    repeatingCheckboxForm: FieldTree<IEveryCheckboxesFormGroupValue>,
  ): void {
    for (const inputName of ['dayOfMonth', 'dayOfWeek', 'hour', 'minute', 'monthOfYear'] as const) {
      const resetValue = this.getEmptyInputValue(inputName);

      if (resetValue !== undefined) {
        inputsForm[inputName]().reset(resetValue);
      }
    }

    repeatingCheckboxForm().value.set({
      day: false,
      hour: false,
      minute: false,
      monthOfYear: false,
    });
  }

  private convertCronInputToFormControlValue(
    inputValue: string,
    inputName: keyof IInputsFormGroup,
  ): TNmcsValue | undefined {
    return inputValue === '*' ? this.getEmptyInputValue(inputName) : this.getInputValue(inputName, inputValue);
  }

  private getEmptyInputValue(inputName: keyof IInputsFormGroup): [] | null | undefined {
    return inputName in this.inputsForm()
      ? Array.isArray(this.inputsForm()[inputName]().value())
        ? []
        : null
      : undefined;
  }

  private getInputValue(inputName: keyof IInputsFormGroup, stringValue: string): number | number[] | undefined {
    return inputName in this.inputsForm()().value()
      ? Array.isArray(this.inputsForm()[inputName]().value())
        ? stringValue.split(',').map(Number)
        : Number(stringValue)
      : undefined;
  }

  private getActiveInputsBasedOnActiveTab(): [boolean, boolean, boolean, boolean, boolean] {
    switch (this.selectedTab()) {
      case 'hour':
        return [true, false, false, false, false];
      case 'day':
        return [true, true, false, false, false];
      case 'week':
        return [true, true, false, false, true];
      case 'month':
        return [true, true, true, false, false];
      case 'year':
        return [true, true, true, true, false];
    }
  }

  private getActiveCheckboxesBasedOnActiveTab(): [boolean, boolean, boolean, boolean] {
    switch (this.selectedTab()) {
      case 'hour':
        return [true, false, false, false];
      case 'day':
        return [true, true, false, false];
      case 'week':
        return [true, true, true, false];
      case 'month':
        return [true, true, true, false];
      case 'year':
        return [true, true, true, true];
    }
  }

  private getMonthAndDayOrder(): ('month' | 'day')[] {
    const locale = this.matDateLocale ?? 'en-US';
    const parts = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(new Date(2020, 11, 31));

    return parts.filter((part) => ['day', 'month'].includes(part.type)).map((part) => part.type as 'day' | 'month');
  }

  private getCheckboxName(fieldName: (typeof inputFields)[number]): keyof IEveryCheckboxesFormGroupValue {
    return fieldName === 'dayOfMonth' || fieldName === 'dayOfWeek' ? 'day' : fieldName;
  }

  private validateInputCron(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    const split = value.split(' ');

    if (split.length !== 5) {
      return null;
    }

    const isValid = Array.from(inputFields.entries()).every(([index, field]) => {
      if (split[index] === '*') {
        return true;
      }

      const isMulti = Array.isArray(this.inputsForm()[field]().value());
      const values = isMulti ? split[index].split(',') : [split[index]];
      const [min, max] = inputFieldRanges[field];

      return values.every((val) => {
        if (val === '' || Number.isNaN(Number(val))) {
          return false;
        }

        const num = Number(val);

        return num >= min && num <= max;
      });
    });

    return isValid ? value : null;
  }

  private getSelectedTab(): keyof ITab {
    const initialValue = this.initialValue();
    const manuallySelectedTab = this.manuallySelectedTab();

    if (manuallySelectedTab !== null) {
      return this.getMostAccurateAvailableTab(manuallySelectedTab);
    }

    if (initialValue === null) {
      return this.getMostAccurateAvailableTab(
        this.effectiveVisibleTabs()[this.initialTab()]
          ? this.initialTab()
          : (Object.entries(this.effectiveVisibleTabs()).find(([, isVisible]) => isVisible)![0] as keyof ITab),
      );
    }

    return this.getMostAccurateAvailableTab(this.determineTabBasedOnCronInput(initialValue));
  }

  private determineTabBasedOnCronInput(value: string): keyof ITab {
    const [_minute, hour, dayOfMonth, month, dayOfWeek] = value.split(' ');

    const isHourUnspecified = hour === '*';
    const isDayOfMonthUnspecified = dayOfMonth === '*';
    const isMonthUnspecified = month === '*';
    const isDayOfWeekUnspecified = dayOfWeek === '*';

    if (isHourUnspecified && isDayOfMonthUnspecified && isMonthUnspecified && isDayOfWeekUnspecified) {
      return 'hour';
    }

    if (isDayOfMonthUnspecified && isMonthUnspecified && isDayOfWeekUnspecified) {
      return 'day';
    }

    if (isDayOfMonthUnspecified && isMonthUnspecified) {
      return 'week';
    }

    return isMonthUnspecified ? 'month' : 'year';
  }

  private getMostAccurateAvailableTab(tabName: keyof ITab): keyof ITab {
    if (this.effectiveVisibleTabs()[tabName]) {
      return tabName;
    }

    return (['year', 'month', 'week', 'day', 'hour'] as const).find((tab) => this.effectiveVisibleTabs()[tab])!;
  }

  /**
   * The validator this component applies to a given `inputsForm` field (required-when-active + range
   * check), exposed so a consumer building their own `inputsForm` can layer the same rule on top of it.
   * Because this depends on this component's own reactive state (selected tab), it can only be evaluated once
   * this component instance exists — a consumer typically obtains it via `viewChild()` and calls this lazily
   * inside their own schema's `validate()` call (see the library's README for a full example).
   */
  public getInputFieldValidator(fieldName: keyof IInputsFormGroup): FieldValidator<TNmcsValue> {
    return ({ value: valueSig }) => {
      const values = this.toNumberArray(valueSig());
      const isActive = this.getActiveInputsBasedOnActiveTab()[inputFields.indexOf(fieldName)];

      if (isActive && values.length === 0) {
        return { kind: 'required' };
      }

      const [min, max] = inputFieldRanges[fieldName];

      return values.every((value) => value >= min && value <= max) ? null : { kind: 'outOfRange' };
    };
  }

  private getIsInputDisabled(fieldName: keyof IInputsFormGroup): Signal<boolean> {
    return computed(
      () => {
        this.isRepeatingCheckboxAvailabilitySettled();
        const index = inputFields.indexOf(fieldName);
        const isInputActiveBasedOnTab = this.getActiveInputsBasedOnActiveTab()[index];

        return (
          !isInputActiveBasedOnTab ||
          this.isDisabled() ||
          this.repeatingCheckboxForm()[this.getCheckboxName(fieldName)]().value()
        );
      },
      { equal: () => false },
    );
  }

  private getIsRepeatingCheckboxDisabled(fieldName: keyof IEveryCheckboxesFormGroupValue): Signal<boolean> {
    return computed(
      () => {
        this.initializationChecklist.determiningTab();
        const index = repeatingCheckboxFields.indexOf(fieldName);
        const isCheckboxActiveBasedOnTab = this.getActiveCheckboxesBasedOnActiveTab()[index];

        return !isCheckboxActiveBasedOnTab || this.isDisabled() || !this.repeatingCheckboxesVisibility()[fieldName];
      },
      { equal: () => false },
    );
  }

  private toNumberArray(value: TNmcsValue): number[] {
    return Array.isArray(value) ? value : value === null ? [] : [value];
  }
}
