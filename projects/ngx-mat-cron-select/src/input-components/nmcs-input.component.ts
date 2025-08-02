import { computed, Directive, effect, forwardRef, input, InputSignal, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, TouchedChangeEvent, Validators } from '@angular/forms';
import { BehaviorSubject, filter, map, Observable, startWith, switchMap } from 'rxjs';

export type TNmcsSingleSelectValue = number | null;
export type TNmcsMultiSelectValue = number[];
export type TNmcsValue = TNmcsMultiSelectValue | TNmcsSingleSelectValue;

@Directive({
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NmcsInput),
    },
  ],
})
export abstract class NmcsInput<FormControlValue extends TNmcsValue> implements ControlValueAccessor {
  public formControl: InputSignal<FormControl<FormControlValue>> = input<FormControl<FormControlValue>>(
    new FormControl<number[]>([], {
      nonNullable: true,
      validators: [Validators.required],
    }) as FormControl<FormControlValue>,
  );
  protected isInitialized = false;
  protected previousValue: FormControlValue | undefined;
  public readonly valueChange = output<number | null | number[]>();

  protected readonly onTouchAdapter: BehaviorSubject<Observable<boolean>> = new BehaviorSubject(
    new Observable<boolean>().pipe(startWith(false)),
  );
  protected readonly inputsFormGroupValueAdapter: BehaviorSubject<Observable<FormControlValue>> = new BehaviorSubject(
    new Observable<FormControlValue>(),
  );
  public readonly isMultiselect = computed(() => Array.isArray(this.formControl().value));

  protected constructor() {
    this.registerInputFormControlEvents();

    this.onTouchAdapter
      .pipe(
        takeUntilDestroyed(),
        switchMap((touchObs) => touchObs),
        takeUntilDestroyed(),
      )
      .subscribe((isTouched) => {
        if (isTouched) {
          this.onTouched();
        }
      });

    this.inputsFormGroupValueAdapter
      .pipe(
        takeUntilDestroyed(),
        switchMap((value) => value),
        takeUntilDestroyed(),
      )
      .subscribe((newValue: FormControlValue) => {
        const prevValue = this.previousValue;

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

  public writeValue(value: FormControlValue): void {
    const valueAfterValidation = this.validateInput(value);

    if (this.formControl().value !== valueAfterValidation) {
      this.formControl().reset(valueAfterValidation);
    }
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange = (_value: FormControlValue): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = (): void => {};

  private registerInputFormControlEvents(): void {
    effect(() => {
      const formControl = this.formControl();

      if (!formControl) {
        return;
      }

      this.onTouchAdapter.next(
        formControl.events.pipe(
          filter((controlEvent) => controlEvent instanceof TouchedChangeEvent),
          map(({ touched }: TouchedChangeEvent) => touched),
        ),
      );
      this.inputsFormGroupValueAdapter.next(formControl.valueChanges.pipe(startWith(formControl.value)));
    });
  }

  private validateInput(value: FormControlValue): FormControlValue {
    const isMulti = Array.isArray(this.formControl().value);

    const isValid = isMulti ? Array.isArray(value) : !Array.isArray(value);

    return isValid ? value : ((isMulti ? [] : null) as FormControlValue);
  }
}
