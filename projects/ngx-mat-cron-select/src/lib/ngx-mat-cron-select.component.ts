import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, forwardRef, input, output, Signal, signal } from '@angular/core';
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
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MAT_TIMEPICKER_CONFIG, MatTimepickerModule } from '@angular/material/timepicker';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, filter, map, Observable, startWith, switchMap } from 'rxjs';
import { ECronSelectTab, IInputsFormGroup } from './ngx-mat-cron-select.interface';

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
    MatInput,
    MatTimepickerModule,
  ],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxMatCronSelectComponent),
    },
    {
      provide: MAT_TIMEPICKER_CONFIG,
      useValue: { interval: '60 minutes' },
    },
  ],
  selector: 'ngx-mat-cron-select',
  styleUrls: ['./ngx-mat-cron-select.component.scss'],
  templateUrl: './ngx-mat-cron-select.component.html',
})
export class NgxMatCronSelectComponent implements ControlValueAccessor {
  public initialTab = input<ECronSelectTab>(ECronSelectTab.week);
  public inputsFormGroup = input(
    new FormGroup({
      dayOfMonth: new FormControl<number[] | null>(null, [Validators.required]),
      dayOfWeek: new FormControl<number[] | null>(null, [Validators.required]),
      hour: new FormControl<number[] | null>(null, [Validators.required]),
      minute: new FormControl<number[] | null>(null, [Validators.required]),
      monthOfYear: new FormControl<number[] | null>(null, [Validators.required]),
    }),
  );

  public readonly valueChange = output<string | null>();

  private readonly onTouchAdapter: BehaviorSubject<Observable<boolean>> = new BehaviorSubject(
    new Observable<boolean>().pipe(startWith(false)),
  );
  private readonly inputsFormGroupValueAdapter: BehaviorSubject<Observable<IInputsFormGroup>> = new BehaviorSubject(
    new Observable<IInputsFormGroup>().pipe(startWith(this.inputsFormGroup().value as IInputsFormGroup)),
  );

  public inputsFormGroupValue = toSignal(
    this.inputsFormGroupValueAdapter.pipe(
      switchMap((valueObs) => valueObs),
      takeUntilDestroyed(),
    ),
    { initialValue: this.inputsFormGroup().value as IInputsFormGroup },
  );

  protected readonly manuallySelectedTab = signal<ECronSelectTab | null>(null);

  protected selectedTab: Signal<ECronSelectTab> = computed(() => {
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

  public value = computed(() => {
    const formValues = this.inputsFormGroupValue();

    switch (this.selectedTab()) {
      case ECronSelectTab.hour:
        return formValues.minute?.length ? `${formValues.minute.join(',')} * * * *` : null;
      case ECronSelectTab.day:
        return formValues.minute?.length && formValues.hour?.length
          ? `${formValues.minute.join(',')} ${formValues.hour.join(',')} * * *`
          : null;
      case ECronSelectTab.week:
        return formValues.minute?.length && formValues.hour?.length && formValues.dayOfWeek?.length
          ? `${formValues.minute.join(',')} ${formValues.hour.join(',')} * * ${formValues.dayOfWeek.join(',')}`
          : null;

      case ECronSelectTab.month:
        return formValues.minute?.length &&
          formValues.hour?.length &&
          formValues.dayOfWeek?.length &&
          formValues.dayOfMonth?.length
          ? `${formValues.minute.join(',')} ${formValues.hour.join(',')} ${formValues.dayOfMonth.join(',')} * ${formValues.dayOfWeek.join(',')}`
          : null;

      case ECronSelectTab.year:
        return formValues.minute?.length &&
          formValues.hour?.length &&
          formValues.dayOfWeek?.length &&
          formValues.dayOfMonth?.length &&
          formValues.monthOfYear?.length
          ? `${formValues.minute.join(',')} ${formValues.hour.join(',')} ${formValues.dayOfMonth.join(',')} ${formValues.monthOfYear.join(',')} ${formValues.dayOfWeek.join(',')}`
          : null;
    }
  });

  public isDisabled = signal(false);

  private readonly inputCron = signal<string>('');

  protected readonly minuteOptions = Array(60)
    .fill(null)
    .map((_, index) => index);

  private isInitialized = false;
  private previousValue: string | null = null;

  constructor() {
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

    effect(() => {
      const inputsFormGroup = this.inputsFormGroup();
      this.onTouchAdapter.next(
        inputsFormGroup.events.pipe(
          filter((controlEvent) => controlEvent instanceof TouchedChangeEvent),
          map(({ touched }: TouchedChangeEvent) => touched),
        ),
      );
      this.inputsFormGroupValueAdapter.next(
        (inputsFormGroup.valueChanges as Observable<IInputsFormGroup>).pipe(
          startWith(inputsFormGroup.value as IInputsFormGroup),
        ),
      );
    });

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
    // minute can't be *
    this.manuallySelectedTab.set(null);
    this.inputCron.set(value);
    const [minute, hour, dayOfMonth, monthOfYear, dayOfWeek] = value.split(' ');

    this.inputsFormGroup().reset({
      dayOfMonth: dayOfMonth === '*' ? null : dayOfMonth.split(',').map(Number),
      dayOfWeek: dayOfWeek === '*' ? null : dayOfWeek.split(',').map(Number),
      hour: hour === '*' ? null : hour.split(',').map(Number),
      minute: minute.split(',').map(Number),
      monthOfYear: monthOfYear === '*' ? null : monthOfYear.split(',').map(Number),
    });
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
