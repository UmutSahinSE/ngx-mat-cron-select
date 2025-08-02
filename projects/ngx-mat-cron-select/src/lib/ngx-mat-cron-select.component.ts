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
import { NmcsMinuteSelectComponent } from '../input-components/nmcs-minute-select/nmcs-minute-select.component';
import { NmcsMonthOfYearSelectComponent } from '../input-components/nmcs-month-of-year-select/nmcs-month-of-year-select.component';
import { TranslateOrUseDefaultPipe } from '../translate-or-use-default.pipe';
import {
  ECronSelectTab,
  IEveryCheckboxesFormGroup,
  IEveryCheckboxesFormGroupValue,
  IInputsFormGroup,
  IInputsFormGroupValue,
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

  public initialTab = input<ECronSelectTab>(ECronSelectTab.week);
  public inputsFormGroup: InputSignal<FormGroup<IInputsFormGroup>> = input(
    new FormGroup<IInputsFormGroup>({
      dayOfMonth: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      dayOfWeek: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      hour: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      minute: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
      monthOfYear: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] }),
    }),
  );

  public everyCheckboxesFormGroup = input<FormGroup<IEveryCheckboxesFormGroup>>(
    new FormGroup<IEveryCheckboxesFormGroup>({
      day: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      hour: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      minute: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
      monthOfYear: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
    }),
  );

  public everyCheckboxesVisibility = input<IEveryCheckboxesFormGroupValue>({
    day: true,
    hour: true,
    minute: true,
    monthOfYear: true,
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

  protected readonly manuallySelectedTab = signal<ECronSelectTab | null>(null);

  protected readonly selectedTab: Signal<ECronSelectTab> = computed(() => {
    const value = this.inputCron();
    const manuallySelectedTab = this.manuallySelectedTab();

    if (value === null && manuallySelectedTab === null) {
      return this.initialTab();
    }

    if (manuallySelectedTab !== null) {
      return manuallySelectedTab;
    }

    const [_minute, hour, dayOfMonth, month, dayOfWeek] = value.split(' ');

    const isHourUnspecified = hour === '*';
    const isDayOfMonthUnspecified = dayOfMonth === '*';
    const isMonthUnspecified = month === '*';
    const isDayOfWeekUnspecified = dayOfWeek === '*';

    if (isHourUnspecified && isDayOfMonthUnspecified && isMonthUnspecified && isDayOfWeekUnspecified) {
      return ECronSelectTab.hour;
    }

    if (isDayOfMonthUnspecified && isMonthUnspecified && isDayOfWeekUnspecified) {
      return ECronSelectTab.day;
    }

    if (isDayOfMonthUnspecified && isMonthUnspecified) {
      return ECronSelectTab.week;
    }

    return isMonthUnspecified ? ECronSelectTab.month : ECronSelectTab.year;
  });

  protected readonly monthAndDayOrder: ('day' | 'month')[] = this.getMonthAndDayOrder();
  public readonly value = computed(() => {
    const formValues = this.inputsFormGroupValue();

    // TODO also check if empty
    if (!this.inputsFormGroup().valid) {
      return null;
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

  public readonly isDisabled = signal(false);
  private readonly inputCron = signal<string>('');

  private isInitialized = false;
  private previousValue: string | null = null;
  protected readonly ECronSelectTab = ECronSelectTab;

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

  public writeValue(value: string): void {
    // TODO validate cron
    // check single select form group vs value

    this.manuallySelectedTab.set(null);
    this.inputCron.set(value);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    // TODO use isDisabled
    this.isDisabled.set(isDisabled);
  }

  private registerEveryCheckboxStatusBasedOnActiveTab(): void {
    effect(() => {
      for (const [index, isActive] of this.getActiveEveryCheckboxesBasedOnActiveTab().entries()) {
        const fieldName = everyDropdownFields[index];
        const everyCheckboxesControl = this.everyCheckboxesFormGroup().controls[fieldName];

        if (!isActive) {
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
        if (!isActive) {
          continue;
        }

        const fieldName = cronFields[index];
        const inputsControl = this.inputsFormGroup().controls[fieldName];

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

      if (!this.isInitialized || prevValue === newValue) {
        this.isInitialized = true;

        return;
      }

      this.previousValue = newValue;
      this.valueChange.emit(newValue);

      // TODO prevent onchange from running on initialization
      this.onChange(newValue);
    });
  }

  private registerFormControlInitialization(): void {
    effect(() => {
      const value = this.inputCron();
      const [minute, hour, dayOfMonth, monthOfYear, dayOfWeek] = value.split(' ');

      this.inputsFormGroup().reset({
        dayOfMonth:
          dayOfMonth === '*' ? this.getEmptyInputValue('dayOfMonth') : this.getInputValue('dayOfMonth', dayOfMonth),
        dayOfWeek:
          dayOfWeek === '*' ? this.getEmptyInputValue('dayOfWeek') : this.getInputValue('dayOfWeek', dayOfWeek),
        hour: hour === '*' ? this.getEmptyInputValue('hour') : this.getInputValue('hour', hour),
        minute: minute === '*' ? this.getEmptyInputValue('minute') : this.getInputValue('minute', minute),
        monthOfYear:
          monthOfYear === '*' ? this.getEmptyInputValue('monthOfYear') : this.getInputValue('monthOfYear', monthOfYear),
      });
    });
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
      case ECronSelectTab.hour:
        return [true, false, false, false, false];
      case ECronSelectTab.day:
        return [true, true, false, false, false];
      case ECronSelectTab.week:
        return [true, true, false, false, true];
      case ECronSelectTab.month:
        return [true, true, true, false, false];
      case ECronSelectTab.year:
        return [true, true, true, true, false];
    }
  }

  private getActiveEveryCheckboxesBasedOnActiveTab(): [boolean, boolean, boolean, boolean] {
    switch (this.selectedTab()) {
      case ECronSelectTab.hour:
        return [true, false, false, false];
      case ECronSelectTab.day:
        return [true, true, false, false];
      case ECronSelectTab.week:
        return [true, true, true, false];
      case ECronSelectTab.month:
        return [true, true, true, false];
      case ECronSelectTab.year:
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
}
