import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  output,
  Signal,
  signal,
} from '@angular/core';
import { untracked } from '@angular/core/primitives/signals';
import { ReactiveFormsModule } from '@angular/forms';
import { disabled, FieldTree, FieldValidator, form, validate } from '@angular/forms/signals';
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
import { IEveryCheckboxesFormGroupValue, IInputsFormGroup, ITab } from './ngx-mat-cron-select.interface';

const inputFields = [
  'minute',
  'hour',
  'dayOfMonth',
  'monthOfYear',
  'dayOfWeek',
] as const satisfies (keyof IInputsFormGroup)[number][];
const repeatingCheckboxFields = [
  'minute',
  'hour',
  'day',
  'monthOfYear',
] as const satisfies (keyof IEveryCheckboxesFormGroupValue)[number][];
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

  public readonly repeatingCheckboxFieldTree: InputSignal<FieldTree<IEveryCheckboxesFormGroupValue>> = input(
    form(this.repeatingCheckboxesModel, (schema) => {
      for (const fieldName of repeatingCheckboxFields) {
        disabled(schema[fieldName], { when: this.isCheckboxDisabled[fieldName] });
      }
    }),
  );

  public readonly inputsFormGroup: InputSignal<FieldTree<IInputsFormGroup>> = input(
    form(this.inputsModel, (schema) => {
      for (const fieldName of inputFields) {
        validate(schema[fieldName], this.getInputFieldValidator(fieldName));
        disabled(schema[fieldName], { when: this.isInputDisabled[fieldName] });
      }
    }),
  );
  public readonly value = computed(() => {
    const formValues = this.inputsFormGroup()().value();
    const repeatingCheckboxValue = this.repeatingCheckboxFieldTree()().controlValue();
    const activeCheckboxes = this.getActiveCheckboxesBasedOnActiveTab();

    if (!this.inputsFormGroup()().valid()) {
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
  private previousInputsFormGroup: FieldTree<IInputsFormGroup> | undefined = undefined;
  private previousRepeatingCheckboxFieldTree: FieldTree<IEveryCheckboxesFormGroupValue> | undefined = undefined;

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

      const repeatingCheckboxFormGroup = this.repeatingCheckboxFieldTree();

      repeatingCheckboxFields.forEach((fieldName, index) => {
        if (activeCheckboxes[index] && !previousActiveCheckboxes[index]) {
          repeatingCheckboxFormGroup[fieldName]().value.set(true);
        }
      });
    });
  }

  private registerFormControlInitialization(): void {
    effect(() => {
      const initialValue = this.initialValue();
      const inputsFormGroup = this.inputsFormGroup();
      const repeatingCheckboxFieldTree = this.repeatingCheckboxFieldTree();

      const haveFormTreesBeenReassigned =
        inputsFormGroup !== this.previousInputsFormGroup ||
        repeatingCheckboxFieldTree !== this.previousRepeatingCheckboxFieldTree;

      this.previousInputsFormGroup = inputsFormGroup;
      this.previousRepeatingCheckboxFieldTree = repeatingCheckboxFieldTree;

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
    const inputsFormGroup = this.inputsFormGroup();
    const repeatingCheckboxFormGroup = this.repeatingCheckboxFieldTree();

    if (initialValue === null) {
      if (!inputsFormGroup().valid()) {
        this.initializeWithoutStartingValue(inputsFormGroup, repeatingCheckboxFormGroup);
      }

      return;
    }

    this.setFormUsingInitialValue(initialValue, inputsFormGroup, repeatingCheckboxFormGroup, selectedTab);
  }

  private setFormUsingInitialValue(
    initialValue: string,
    inputsFormGroup: FieldTree<IInputsFormGroup>,
    repeatingCheckboxFormGroup: FieldTree<IEveryCheckboxesFormGroupValue>,
    selectedTab: keyof ITab,
  ): void {
    const split = initialValue.split(' ');
    const [minute, hour, dayOfMonth, monthOfYear, dayOfWeek] = split;
    const splitAsObject = { dayOfMonth, dayOfWeek, hour, minute, monthOfYear };

    for (const inputName of ['dayOfMonth', 'dayOfWeek', 'hour', 'minute', 'monthOfYear'] as const) {
      const formControlValue = this.convertCronInputToFormControlValue(splitAsObject[inputName], inputName);

      if (formControlValue !== undefined) {
        inputsFormGroup[inputName]().reset(formControlValue);
      }
    }

    for (const [index, fieldValue] of split.entries()) {
      if (index === 2 || index === 4) {
        continue;
      }

      const checkboxName = this.getCheckboxName(inputFields[index]);
      repeatingCheckboxFormGroup[checkboxName]().reset(fieldValue === '*');
    }

    const shouldCheckboxBeEnabledForDayOfMonth = ['month', 'year'].includes(selectedTab) && dayOfMonth === '*';
    const shouldCheckboxBeEnabledForDayOfWeek = selectedTab === 'week' && dayOfWeek === '*';

    repeatingCheckboxFormGroup.day().reset(shouldCheckboxBeEnabledForDayOfMonth || shouldCheckboxBeEnabledForDayOfWeek);
  }

  private initializeWithoutStartingValue(
    inputsFormGroup: FieldTree<IInputsFormGroup>,
    repeatingCheckboxFormGroup: FieldTree<IEveryCheckboxesFormGroupValue>,
  ): void {
    for (const inputName of ['dayOfMonth', 'dayOfWeek', 'hour', 'minute', 'monthOfYear'] as const) {
      const resetValue = this.getEmptyInputValue(inputName);

      if (resetValue !== undefined) {
        inputsFormGroup[inputName]().reset(resetValue);
      }
    }

    repeatingCheckboxFormGroup().value.set({
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
    return inputName in this.inputsFormGroup()
      ? Array.isArray(this.inputsFormGroup()[inputName]().value())
        ? []
        : null
      : undefined;
  }

  private getInputValue(inputName: keyof IInputsFormGroup, stringValue: string): number | number[] | undefined {
    return inputName in this.inputsFormGroup()().value()
      ? Array.isArray(this.inputsFormGroup()[inputName]().value())
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

      const isMulti = Array.isArray(this.inputsFormGroup()[field]().value());
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

  private getInputFieldValidator(fieldName: (typeof inputFields)[number]): FieldValidator<TNmcsValue> {
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
          this.repeatingCheckboxFieldTree()[this.getCheckboxName(fieldName)]().value()
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
