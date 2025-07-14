import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, forwardRef, input, InputSignal, output, Signal, signal } from '@angular/core';
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
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { NmcsHourSelectComponent } from '../input-components/nmcs-hour-select/nmcs-hour-select.component';
import { TNmcsValue } from '../input-components/nmcs-input.component';
import { TranslateOrUseDefaultPipe } from '../translate-or-use-default.pipe';
import { ECronSelectTab, IInputsFormGroupValue } from './ngx-mat-cron-select.interface';

export interface IInputsFormGroup {
  dayOfMonth: FormControl<TNmcsValue>;
  dayOfWeek: FormControl<TNmcsValue>;
  hour: FormControl<TNmcsValue>;
  minute: FormControl<TNmcsValue>;
  monthOfYear: FormControl<TNmcsValue>;
}

const cronFields = ['minute', 'hour', 'dayOfMonth', 'monthOfYear', 'dayOfWeek'] as const;

@Component({
  imports: [
    MatTabGroup,
    MatTab,
    ReactiveFormsModule,
    MatFormField,
    MatSelect,
    TranslateModule,
    MatOption,
    MatLabel,
    NgTemplateOutlet,
    MatTimepickerModule,
    MatFormFieldModule,
    TranslateOrUseDefaultPipe,
    NmcsHourSelectComponent,
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

  public readonly valueChange = output<string | null>();

  private readonly onTouchAdapter: BehaviorSubject<Observable<boolean>> = new BehaviorSubject(
    new Observable<boolean>().pipe(startWith(false)),
  );
  private readonly inputsFormGroupValueAdapter: BehaviorSubject<Observable<IInputsFormGroupValue>> =
    new BehaviorSubject(
      new Observable<IInputsFormGroupValue>().pipe(startWith(this.inputsFormGroup().value as IInputsFormGroupValue)),
    );

  public readonly inputsFormGroupValue = toSignal(
    this.inputsFormGroupValueAdapter.pipe(
      switchMap((valueObs) => valueObs),
      takeUntilDestroyed(),
    ),
    { initialValue: this.inputsFormGroup().value as IInputsFormGroupValue },
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

        return Array.isArray(formValues[fieldName]) ? formValues[fieldName].join(',') : formValues[fieldName];
      })
      .join(' ');
  });

  public readonly isDisabled = signal(false);
  private readonly inputCron = signal<string>('');

  protected readonly minuteOptions = Array(60)
    .fill(null)
    .map((_, index) => index);

  private isInitialized = false;
  private previousValue: string | null = null;

  constructor() {
    this.registerInputFormControlEvents();
    this.registerFormControlInitialization();
    this.registerInputStatusBasedOnActiveTab();
    this.registerOnChangeCall();

    this.onTouchAdapter.pipe(switchMap((touchObs) => touchObs)).subscribe((isTouched) => {
      if (isTouched) {
        this.onTouched();
      }
    });
  }

  private onChange = (_value: string | null): void => {};
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

  private registerInputStatusBasedOnActiveTab(): void {
    effect(() => {
      for (const [index, isActive] of this.getActiveInputsBasedOnActiveTab().entries()) {
        const fieldName = cronFields[index];

        if (isActive) {
          this.inputsFormGroup().controls[fieldName].enable();
        } else {
          this.inputsFormGroup().controls[fieldName].disable();
        }
      }
    });
  }

  private registerInputFormControlEvents(): void {
    effect(() => {
      const inputsFormGroup = this.inputsFormGroup();
      this.onTouchAdapter.next(
        inputsFormGroup.events.pipe(
          filter((controlEvent) => controlEvent instanceof TouchedChangeEvent),
          map(({ touched }: TouchedChangeEvent) => touched),
        ),
      );
      this.inputsFormGroupValueAdapter.next(
        (inputsFormGroup.valueChanges as Observable<IInputsFormGroupValue>).pipe(
          startWith(inputsFormGroup.value as IInputsFormGroupValue),
        ),
      );
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
        return [true, true, true, false, true];
      case ECronSelectTab.year:
        return [true, true, true, true, true];
    }
  }
}
