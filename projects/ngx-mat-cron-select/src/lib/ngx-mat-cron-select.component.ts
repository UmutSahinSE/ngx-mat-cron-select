import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  InputSignal,
  output,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { BehaviorSubject, combineLatest, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { NmcsDayOfMonthSelectComponent } from '../input-components/nmcs-day-of-month-select/nmcs-day-of-month-select.component';
import { NmcsDayOfWeekSelectComponent } from '../input-components/nmcs-day-of-week-select/nmcs-day-of-week-select.component';
import { NmcsHourSelectComponent } from '../input-components/nmcs-hour-select/nmcs-hour-select.component';
import { TNmcsValue } from '../input-components/nmcs-input.component';
import { NmcsMinuteSelectComponent } from '../input-components/nmcs-minute-select/nmcs-minute-select.component';
import { NmcsMonthOfYearSelectComponent } from '../input-components/nmcs-month-of-year-select/nmcs-month-of-year-select.component';
import { TranslateOrUseDefaultPipe } from '../translate-or-use-default.pipe';
import {
  IEveryCheckboxesFormGroup,
  IEveryCheckboxesFormGroupValue,
  IInputsFormGroup,
  IInputsFormGroupValue,
  ITab,
} from './ngx-mat-cron-select.interface';

const cronFields = [
  'minute',
  'hour',
  'dayOfMonth',
  'monthOfYear',
  'dayOfWeek',
] as const satisfies (keyof IInputsFormGroupValue)[number][];
const everyDropdownFields = [
  'minute',
  'hour',
  'day',
  'monthOfYear',
] as const satisfies (keyof IEveryCheckboxesFormGroupValue)[number][];

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
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMatCronSelectComponent),
    },
  ],
  selector: 'ngx-mat-cron-select',
  styleUrls: ['./ngx-mat-cron-select.component.scss'],
  templateUrl: './ngx-mat-cron-select.component.html',
})
export class NgxMatCronSelectComponent implements ControlValueAccessor {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });

  public readonly initialTab = input<keyof ITab>('week');
  public readonly inputsFormGroup: InputSignal<FormGroup<IInputsFormGroup>> = input(
    new FormGroup<IInputsFormGroup>({
      dayOfMonth: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      dayOfWeek: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      hour: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      minute: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      monthOfYear: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    }),
  );

  public readonly everyCheckboxesFormGroup = input<FormGroup<IEveryCheckboxesFormGroup>>(
    new FormGroup<IEveryCheckboxesFormGroup>({
      day: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      hour: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      minute: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      monthOfYear: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
    }),
  );

  public readonly everyCheckboxesVisibility = input<IEveryCheckboxesFormGroupValue>({
    day: true,
    hour: true,
    minute: true,
    monthOfYear: true,
  });

  public readonly isDisabled = input<boolean>(false);
  public readonly visibleTabs = input<ITab>({
    day: true,
    hour: true,
    month: true,
    week: true,
    year: true,
  });

  public readonly valueChange = output<string | null>();

  private readonly onTouchAdapter: BehaviorSubject<Observable<boolean>> = new BehaviorSubject(
    new Observable<boolean>().pipe(startWith(false)),
  );
  private readonly inputsFormGroupValueAdapter: BehaviorSubject<Observable<Partial<IInputsFormGroupValue>>> =
    new BehaviorSubject(new Observable<Partial<IInputsFormGroupValue>>().pipe(startWith(this.inputsFormGroup().value)));
  private readonly everyCheckboxesFormGroupValueAdapter: BehaviorSubject<
    Observable<Partial<IEveryCheckboxesFormGroupValue>>
  > = new BehaviorSubject(
    new Observable<Partial<IEveryCheckboxesFormGroupValue>>().pipe(startWith(this.everyCheckboxesFormGroup().value)),
  );

  public readonly inputsFormGroupValue = toSignal(
    this.inputsFormGroupValueAdapter.pipe(
      switchMap((valueObs) => valueObs),
      takeUntilDestroyed(),
    ),
    { initialValue: this.inputsFormGroup().value },
  );

  public readonly everyCheckboxesFormGroupValue = toSignal(
    this.everyCheckboxesFormGroupValueAdapter.pipe(
      switchMap((valueObs) => valueObs),
      takeUntilDestroyed(),
    ),
    { initialValue: this.everyCheckboxesFormGroup().value },
  );

  protected readonly effectiveVisibleTabs = computed(() => {
    const areAnyTabsVisible = Object.values(this.visibleTabs()).some(Boolean);

    return areAnyTabsVisible ? this.visibleTabs() : { ...this.visibleTabs(), hour: true };
  });
  protected readonly isThereASingleVisibleTab = computed(() => {
    return Object.values(this.effectiveVisibleTabs()).filter(Boolean).length === 1;
  });
  protected readonly manuallySelectedTab = signal<keyof ITab | null>(null);

  protected readonly selectedTab: Signal<keyof ITab> = computed(() => {
    const inputCron = this.inputCron();
    const manuallySelectedTab = this.manuallySelectedTab();

    if (manuallySelectedTab !== null) {
      return this.getMostAccurateAvailableTab(manuallySelectedTab);
    }

    if (inputCron === null) {
      return this.getMostAccurateAvailableTab(
        this.effectiveVisibleTabs()[this.initialTab()]
          ? this.initialTab()
          : (Object.entries(this.effectiveVisibleTabs()).find(([, isVisible]) => isVisible)![0] as keyof ITab),
      );
    }

    return this.getMostAccurateAvailableTab(this.determineTabBasedOnCronInput(inputCron));
  });

  protected readonly selectedTabIndex = computed(() => {
    const index = (['hour', 'day', 'week', 'month', 'year'] as (keyof ITab)[])
      .filter((tabName) => this.effectiveVisibleTabs()[tabName])
      .indexOf(this.selectedTab());

    return index === -1 ? 0 : index;
  });

  protected readonly monthAndDayOrder: ('day' | 'month')[] = this.getMonthAndDayOrder();
  public readonly value = computed(() => {
    const formValues = this.inputsFormGroupValue();

    if (!this.inputsFormGroup().valid) {
      const everyCheckboxes = Object.values(this.everyCheckboxesFormGroupValue());

      return everyCheckboxes.length && everyCheckboxes.every(Boolean) ? '* * * * *' : null;
    }

    return this.getActiveInputsBasedOnActiveTab()
      .map((isActive, index) => {
        if (!isActive) {
          return '*';
        }

        const fieldName = cronFields[index];

        return Array.isArray(formValues[fieldName])
          ? formValues[fieldName].join(',')
          : this.everyCheckboxesFormGroupValue()[this.getCheckboxName(fieldName)]
            ? '*'
            : formValues[fieldName];
      })
      .join(' ');
  });

  private readonly inputCron = signal<string | null>(null);

  private isInitialized = false;
  private previousValue: string | null = null;

  constructor() {
    this.registerInputFormControlEvents();
    this.registerFormControlInitialization();
    this.registerEveryCheckboxStatusBasedOnActiveTab();
    this.registerDisableOrEnableInputs();
    this.registerOnChangeCall();
    this.onTouchAdapter.pipe(switchMap((touchObs) => touchObs)).subscribe((isTouched) => {
      if (isTouched) {
        this.onTouched();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange = (_value: string | null): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = (): void => {};

  public writeValue(value: string | null): void {
    const valueAfterValidation = this.validateInputCron(value);

    this.manuallySelectedTab.set(null);
    this.inputCron.set(valueAfterValidation);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  protected setTab(tabIndex: number): void {
    const tabs: (keyof ITab)[] = ['hour', 'day', 'week', 'month', 'year'];
    const visibleTabs = tabs.filter((tabName) => this.effectiveVisibleTabs()[tabName]);
    this.manuallySelectedTab.set(visibleTabs[tabIndex]);
  }

  private registerEveryCheckboxStatusBasedOnActiveTab(): void {
    effect(() => {
      for (const [index, isActive] of this.getActiveEveryCheckboxesBasedOnActiveTab().entries()) {
        const fieldName = everyDropdownFields[index];
        const everyCheckboxesControl = this.everyCheckboxesFormGroup().controls[fieldName];

        if (this.isDisabled()) {
          everyCheckboxesControl.disable();

          continue;
        }

        if (!isActive || !this.everyCheckboxesVisibility()[everyDropdownFields[index]]) {
          everyCheckboxesControl.disable();

          continue;
        }

        if (everyCheckboxesControl.enabled) {
          continue;
        }

        everyCheckboxesControl.reset(false);
        everyCheckboxesControl.enable();
      }
    });
  }

  private registerInputFormControlEvents(): void {
    effect(() => {
      const inputsFormGroup = this.inputsFormGroup();
      const everyCheckboxesFormGroup = this.everyCheckboxesFormGroup();
      this.onTouchAdapter.next(
        combineLatest([
          inputsFormGroup.events.pipe(filter((controlEvent) => controlEvent instanceof TouchedChangeEvent)),
          everyCheckboxesFormGroup.events.pipe(filter((controlEvent) => controlEvent instanceof TouchedChangeEvent)),
        ]).pipe(map((events) => events.some(({ touched }) => touched))),
      );
      this.inputsFormGroupValueAdapter.next(
        (inputsFormGroup.valueChanges as Observable<IInputsFormGroupValue>).pipe(
          startWith(inputsFormGroup.value as IInputsFormGroupValue),
        ),
      );
      this.everyCheckboxesFormGroupValueAdapter.next(
        (everyCheckboxesFormGroup.valueChanges as Observable<IEveryCheckboxesFormGroupValue>).pipe(
          startWith(everyCheckboxesFormGroup.value as IEveryCheckboxesFormGroupValue),
        ),
      );
    });
  }

  private registerDisableOrEnableInputs(): void {
    effect(() => {
      for (const [index, isActive] of this.getActiveInputsBasedOnActiveTab().entries()) {
        const fieldName = cronFields[index];
        const inputsControl = this.inputsFormGroup().controls[fieldName];

        if (!isActive || this.isDisabled()) {
          inputsControl.disable();

          continue;
        }

        if (this.everyCheckboxesFormGroupValue()[this.getCheckboxName(fieldName)]) {
          inputsControl.disable();
        } else {
          inputsControl.enable();
        }
      }
    });
  }

  private registerOnChangeCall(): void {
    effect(() => {
      const prevValue = this.previousValue;
      const newValue = this.value();

      if (!this.isInitialized) {
        this.isInitialized = true;

        return;
      }

      if (prevValue === newValue) {
        return;
      }

      this.previousValue = newValue;
      this.valueChange.emit(newValue);

      this.onChange(newValue);
    });
  }

  private registerFormControlInitialization(): void {
    effect(() => {
      const inputCron = this.inputCron();

      if (inputCron === null) {
        this.inputsFormGroup().reset({
          dayOfMonth: this.getEmptyInputValue('dayOfMonth'),
          dayOfWeek: this.getEmptyInputValue('dayOfWeek'),
          hour: this.getEmptyInputValue('hour'),
          minute: this.getEmptyInputValue('minute'),
          monthOfYear: this.getEmptyInputValue('monthOfYear'),
        });

        return;
      }

      const split = inputCron.split(' ');
      const [minute, hour, dayOfMonth, monthOfYear, dayOfWeek] = split;

      this.inputsFormGroup().reset({
        dayOfMonth: this.convertCronInputToFormControlValue(dayOfMonth, 'dayOfMonth'),
        dayOfWeek: this.convertCronInputToFormControlValue(dayOfWeek, 'dayOfWeek'),
        hour: this.convertCronInputToFormControlValue(hour, 'hour'),
        minute: this.convertCronInputToFormControlValue(minute, 'minute'),
        monthOfYear: this.convertCronInputToFormControlValue(monthOfYear, 'monthOfYear'),
      });

      for (const [index, fieldValue] of split.entries()) {
        if (fieldValue !== '*') {
          continue;
        }

        const checkboxName = this.getCheckboxName(cronFields[index]);
        this.everyCheckboxesFormGroup().controls[checkboxName].reset(true);
      }
    });
  }

  private convertCronInputToFormControlValue(inputValue: string, inputName: keyof IInputsFormGroupValue): TNmcsValue {
    return inputValue === '*' ? this.getEmptyInputValue(inputName) : this.getInputValue(inputName, inputValue);
  }

  private getEmptyInputValue(inputName: keyof IInputsFormGroupValue): [] | null {
    return Array.isArray(this.inputsFormGroup().value[inputName]) ? [] : null;
  }

  private getInputValue(inputName: keyof IInputsFormGroupValue, stringValue: string): number | number[] {
    return Array.isArray(this.inputsFormGroup().value[inputName])
      ? stringValue.split(',').map(Number)
      : Number(stringValue);
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

  private getActiveEveryCheckboxesBasedOnActiveTab(): [boolean, boolean, boolean, boolean] {
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

  private getCheckboxName(fieldName: (typeof cronFields)[number]): keyof IEveryCheckboxesFormGroupValue {
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

    const isValid = Array.from(cronFields.entries()).every(([index, field]) => {
      if (split[index] === '*') {
        return true;
      }

      const isMulti = Array.isArray(this.inputsFormGroup().controls[field].value);

      return isMulti
        ? typeof Number(split[index]) === 'number'
        : split[index].split(',').every((val) => typeof Number(val) === 'number');
    });

    return isValid ? value : null;
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
}
