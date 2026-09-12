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
  createPeriodicCheckboxesSchema,
  createPeriodicStepsSchema,
  inputFields,
  periodicCheckboxFields,
} from './ngx-mat-cron-select-schema';
import {
  IInputsFormGroup,
  IPeriodicCheckboxesFormGroupValue,
  IPeriodicStepsFormGroupValue,
  ITab,
} from './ngx-mat-cron-select.interface';

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

  private readonly periodicCheckboxesModel = signal<IPeriodicCheckboxesFormGroupValue>({
    day: false,
    hour: false,
    minute: false,
    monthOfYear: false,
  });

  private readonly periodicStepsModel = signal<IPeriodicStepsFormGroupValue>({
    day: 1,
    hour: 1,
    minute: 1,
    monthOfYear: 1,
  });

  public readonly periodicCheckboxesVisibility = input<IPeriodicCheckboxesFormGroupValue>({
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
    disablingPeriodicCheckbox: {
      day: signal<symbol | null>(null),
      hour: signal<symbol | null>(null),
      minute: signal<symbol | null>(null),
      monthOfYear: signal<symbol | null>(null),
    },
    initializationDone: signal<symbol | null>(null),
    settingSymbol: signal<symbol | null>(null),
  } as const;

  private readonly isPeriodicCheckboxAvailabilitySettled = computed(() => {
    const disabledStatuses = [
      this.initializationChecklist.disablingPeriodicCheckbox.day(),
      this.initializationChecklist.disablingPeriodicCheckbox.hour(),
      this.initializationChecklist.disablingPeriodicCheckbox.minute(),
      this.initializationChecklist.disablingPeriodicCheckbox.monthOfYear(),
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

  private readonly isPeriodicCheckboxDisabled = {
    day: this.getIsPeriodicCheckboxDisabled('day'),
    hour: this.getIsPeriodicCheckboxDisabled('hour'),
    minute: this.getIsPeriodicCheckboxDisabled('minute'),
    monthOfYear: this.getIsPeriodicCheckboxDisabled('monthOfYear'),
  } as const;

  public readonly periodicCheckboxForm: InputSignal<FieldTree<IPeriodicCheckboxesFormGroupValue>> = input(
    form(
      this.periodicCheckboxesModel,
      createPeriodicCheckboxesSchema(() => this),
    ),
  );

  public readonly periodicStepForm: InputSignal<FieldTree<IPeriodicStepsFormGroupValue>> = input(
    form(
      this.periodicStepsModel,
      createPeriodicStepsSchema(() => this),
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

  /**
   * The disabled-state signal this component uses for a given `periodicCheckboxForm`/`periodicStepForm` field.
   * See getInputFieldValidator.
   */
  public isPeriodicCheckboxFieldDisabled(fieldName: keyof IPeriodicCheckboxesFormGroupValue): Signal<boolean> {
    return this.isPeriodicCheckboxDisabled[fieldName];
  }

  public readonly value = computed(() => {
    const periodicCheckboxValue = this.periodicCheckboxForm()().controlValue();
    const activeCheckboxes = this.getActiveCheckboxesBasedOnActiveTab();
    const activeInputs = this.getActiveInputsBasedOnActiveTab();

    if (!this.inputsForm()().valid()) {
      const areAllActiveCheckboxesChecked = periodicCheckboxFields
        .filter((_, index) => activeCheckboxes[index])
        .every((fieldName) => periodicCheckboxValue[fieldName]);

      if (!areAllActiveCheckboxesChecked) {
        return null;
      }

      return inputFields
        .map((fieldName, index) =>
          activeInputs[index] ? this.renderPeriodicField(this.getPeriodicFieldName(fieldName)) : '*',
        )
        .join(' ');
    }

    return inputFields.map((fieldName, index) => this.renderDigit(fieldName, index)).join(' ');
  });

  private previousValue: string | null = null;
  private previousActiveCheckboxes: readonly boolean[] | null = null;
  private previousPeriodicCheckedValues: IPeriodicCheckboxesFormGroupValue | null = null;
  private previousInputsForm: FieldTree<IInputsFormGroup> | undefined = undefined;
  private previousPeriodicCheckboxForm: FieldTree<IPeriodicCheckboxesFormGroupValue> | undefined = undefined;
  private previousPeriodicStepForm: FieldTree<IPeriodicStepsFormGroupValue> | undefined = undefined;

  constructor() {
    this.registerFormControlInitialization();
    this.registerOnChangeCall();
    this.registerCheckboxAutoCheckOnTabSwitch();
    this.registerStepDefaultOnCheckboxCheck();
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

      const periodicCheckboxForm = this.periodicCheckboxForm();

      periodicCheckboxFields.forEach((fieldName, index) => {
        if (activeCheckboxes[index] && !previousActiveCheckboxes[index]) {
          periodicCheckboxForm[fieldName]().value.set(true);
        }
      });
    });
  }

  /**
   * Whenever a periodic checkbox transitions from unchecked to checked — whether by a direct user click or via
   * registerCheckboxAutoCheckOnTabSwitch's auto-check — its step resets to 1, i.e. the "*" option, per the
   * library's contract that a freshly-checked periodic field always starts out as the plain wildcard rather than
   * whatever step happened to be left over from a previous check.
   */
  private registerStepDefaultOnCheckboxCheck(): void {
    effect(() => {
      if (this.initializationChecklist.settingSymbol() !== this.initializationChecklist.initializationDone()) {
        return;
      }

      const periodicCheckboxForm = this.periodicCheckboxForm();
      const periodicStepForm = this.periodicStepForm();
      const currentCheckedValues = periodicCheckboxForm().controlValue();
      const { previousPeriodicCheckedValues } = this;
      this.previousPeriodicCheckedValues = currentCheckedValues;

      if (previousPeriodicCheckedValues === null) {
        return;
      }

      periodicCheckboxFields.forEach((fieldName) => {
        if (currentCheckedValues[fieldName] && !previousPeriodicCheckedValues[fieldName]) {
          periodicStepForm[fieldName]().value.set(1);
        }
      });
    });
  }

  private registerFormControlInitialization(): void {
    effect(() => {
      const initialValue = this.initialValue();
      const inputsForm = this.inputsForm();
      const periodicCheckboxForm = this.periodicCheckboxForm();
      const periodicStepForm = this.periodicStepForm();

      const haveFormTreesBeenReassigned =
        inputsForm !== this.previousInputsForm ||
        periodicCheckboxForm !== this.previousPeriodicCheckboxForm ||
        periodicStepForm !== this.previousPeriodicStepForm;

      this.previousInputsForm = inputsForm;
      this.previousPeriodicCheckboxForm = periodicCheckboxForm;
      this.previousPeriodicStepForm = periodicStepForm;

      const isInitialValueEchoingLastEmittedValue = untracked(
        () => this.initializationChecklist.initializationDone() !== null && initialValue === this.previousValue,
      );

      if (!haveFormTreesBeenReassigned && isInitialValueEchoingLastEmittedValue) {
        return;
      }

      this.previousActiveCheckboxes = null;
      this.previousPeriodicCheckedValues = null;
      this.initializationChecklist.settingSymbol.set(Symbol());
    });

    effect(() => {
      this.selectedTab();
      this.initializationChecklist.determiningTab.set(this.initializationChecklist.settingSymbol());
    });

    this.registerPeriodicCheckboxesDisable();
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
        if (!untracked(this.isPeriodicCheckboxAvailabilitySettled)) {
          return;
        }

        this.isInputDisabled[fieldName]();
        this.initializationChecklist.disablingInputs[fieldName].set(this.initializationChecklist.settingSymbol());
      });
    }
  }

  private registerPeriodicCheckboxesDisable(): void {
    for (const fieldName of periodicCheckboxFields) {
      effect(() => {
        if (
          untracked(
            () => this.initializationChecklist.determiningTab() !== this.initializationChecklist.settingSymbol(),
          )
        ) {
          return;
        }

        this.isPeriodicCheckboxDisabled[fieldName]();
        this.initializationChecklist.disablingPeriodicCheckbox[fieldName].set(
          this.initializationChecklist.settingSymbol(),
        );
      });
    }
  }

  private initialize(): void {
    const initialValue = this.validateInputCron(this.initialValue());
    const selectedTab = this.selectedTab();
    const inputsForm = this.inputsForm();
    const periodicCheckboxForm = this.periodicCheckboxForm();
    const periodicStepForm = this.periodicStepForm();

    this.manuallySelectedTab.set(null);

    if (initialValue === null) {
      if (!inputsForm().valid()) {
        this.initializeWithoutStartingValue(inputsForm, periodicCheckboxForm, periodicStepForm);
      }

      return;
    }

    this.setFormUsingInitialValue(initialValue, inputsForm, periodicCheckboxForm, periodicStepForm, selectedTab);
  }

  private setFormUsingInitialValue(
    initialValue: string,
    inputsForm: FieldTree<IInputsFormGroup>,
    periodicCheckboxForm: FieldTree<IPeriodicCheckboxesFormGroupValue>,
    periodicStepForm: FieldTree<IPeriodicStepsFormGroupValue>,
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

      const checkboxName = this.getPeriodicFieldName(inputFields[index]);
      const parsed = this.parseWildcardOrStep(fieldValue);

      periodicCheckboxForm[checkboxName]().reset(parsed !== null);
      periodicStepForm[checkboxName]().reset(parsed?.step ?? 1);
    }

    const dayOfMonthParsed = this.parseWildcardOrStep(dayOfMonth);
    const dayOfWeekParsed = this.parseWildcardOrStep(dayOfWeek);
    const shouldCheckboxBeEnabledForDayOfMonth = ['month', 'year'].includes(selectedTab) && dayOfMonthParsed !== null;
    const shouldCheckboxBeEnabledForDayOfWeek = selectedTab === 'week' && dayOfWeekParsed !== null;

    periodicCheckboxForm.day().reset(shouldCheckboxBeEnabledForDayOfMonth || shouldCheckboxBeEnabledForDayOfWeek);
    periodicStepForm
      .day()
      .reset(
        (shouldCheckboxBeEnabledForDayOfMonth
          ? dayOfMonthParsed
          : shouldCheckboxBeEnabledForDayOfWeek
            ? dayOfWeekParsed
            : null
        )?.step ?? 1,
      );
  }

  private initializeWithoutStartingValue(
    inputsForm: FieldTree<IInputsFormGroup>,
    periodicCheckboxForm: FieldTree<IPeriodicCheckboxesFormGroupValue>,
    periodicStepForm: FieldTree<IPeriodicStepsFormGroupValue>,
  ): void {
    for (const inputName of ['dayOfMonth', 'dayOfWeek', 'hour', 'minute', 'monthOfYear'] as const) {
      const resetValue = this.getEmptyInputValue(inputName);

      if (resetValue !== undefined) {
        inputsForm[inputName]().reset(resetValue);
      }
    }

    periodicCheckboxForm().value.set({
      day: false,
      hour: false,
      minute: false,
      monthOfYear: false,
    });

    periodicStepForm().value.set({
      day: 1,
      hour: 1,
      minute: 1,
      monthOfYear: 1,
    });
  }

  private convertCronInputToFormControlValue(
    inputValue: string,
    inputName: keyof IInputsFormGroup,
  ): TNmcsValue | undefined {
    return this.parseWildcardOrStep(inputValue) !== null
      ? this.getEmptyInputValue(inputName)
      : this.getInputValue(inputName, inputValue);
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

  private getPeriodicFieldName(fieldName: (typeof inputFields)[number]): keyof IPeriodicCheckboxesFormGroupValue {
    return fieldName === 'dayOfMonth' || fieldName === 'dayOfWeek' ? 'day' : fieldName;
  }

  // Recognizes a cron field value that's either the plain wildcard ('*', step 1) or a step expression ('*' then
  // a slash then a positive integer). Returns null for anything else (a concrete value or comma-list), which is
  // treated as a real selection.
  private parseWildcardOrStep(value: string): { step: number } | null {
    if (value === '*') {
      return { step: 1 };
    }

    const match = /^\*\/([0-9]+)$/.exec(value);

    return match ? { step: Number(match[1]) } : null;
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
      const parsed = this.parseWildcardOrStep(split[index]);

      if (parsed !== null) {
        const [min, max] = inputFieldRanges[field];

        return parsed.step >= 1 && parsed.step <= max - min + 1;
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
        this.isPeriodicCheckboxAvailabilitySettled();
        const index = inputFields.indexOf(fieldName);
        const isInputActiveBasedOnTab = this.getActiveInputsBasedOnActiveTab()[index];

        return (
          !isInputActiveBasedOnTab ||
          this.isDisabled() ||
          this.periodicCheckboxForm()[this.getPeriodicFieldName(fieldName)]().value()
        );
      },
      { equal: () => false },
    );
  }

  private getIsPeriodicCheckboxDisabled(fieldName: keyof IPeriodicCheckboxesFormGroupValue): Signal<boolean> {
    return computed(
      () => {
        this.initializationChecklist.determiningTab();
        const index = periodicCheckboxFields.indexOf(fieldName);
        const isCheckboxActiveBasedOnTab = this.getActiveCheckboxesBasedOnActiveTab()[index];

        return !isCheckboxActiveBasedOnTab || this.isDisabled() || !this.periodicCheckboxesVisibility()[fieldName];
      },
      { equal: () => false },
    );
  }

  private toNumberArray(value: TNmcsValue): number[] {
    return Array.isArray(value) ? value : value === null ? [] : [value];
  }

  private renderDigit(fieldName: keyof IInputsFormGroup, index: number): string | number {
    const periodicCheckboxValue = this.periodicCheckboxForm()().controlValue();
    const activeCheckboxes = this.getActiveCheckboxesBasedOnActiveTab();
    const activeInputs = this.getActiveInputsBasedOnActiveTab();
    const checkboxName = this.getPeriodicFieldName(fieldName);

    if (!activeInputs[index]) {
      return '*';
    }

    const formValues = Object.fromEntries(
      inputFields.map((fieldName) => [fieldName, this.inputsForm()[fieldName]().value()]),
    ) as unknown as IInputsFormGroup;

    if (activeCheckboxes[periodicCheckboxFields.indexOf(checkboxName)] && periodicCheckboxValue[checkboxName]) {
      return this.renderPeriodicField(checkboxName);
    }

    return Array.isArray(formValues[fieldName])
      ? [...formValues[fieldName]].sort((a, b) => a - b).join(',')
      : formValues[fieldName]!;
  }

  private renderPeriodicField = (fieldName: keyof IPeriodicCheckboxesFormGroupValue): string => {
    const step = this.periodicStepForm()().controlValue()[fieldName];

    return step > 1 ? `*/${step}` : '*';
  };
}
