import { Component, computed, effect, Inject, OnDestroy, Optional, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DATE_LOCALE, MatOption } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import {
  MAT_TIMEPICKER_CONFIG,
  MatTimepicker,
  MatTimepickerInput,
  MatTimepickerToggle,
} from '@angular/material/timepicker';
import { distinctUntilChanged, startWith, Subscription } from 'rxjs';
import { twelveHourLocales } from '../../lib/ngx-mat-cron-select.interface';
import { NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR } from '../../tokens';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { NmcsInput, TNmcsMultiSelectValue, TNmcsSingleSelectValue } from '../nmcs-input.component';

@Component({
  imports: [
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSuffix,
    MatTimepicker,
    MatTimepickerInput,
    MatTimepickerToggle,
    ReactiveFormsModule,
    TranslateOrUseDefaultPipe,
    MatFormField,
    MatError,
    MatFormFieldModule,
    MatSelect,
  ],
  providers: [
    {
      provide: MAT_TIMEPICKER_CONFIG,
      useValue: { interval: '60 minutes' },
    },
  ],
  selector: 'nmcs-hour-select',
  styleUrl: './nmcs-hour-select.component.scss',
  templateUrl: './nmcs-hour-select.component.html',
})
export class NmcsHourSelectComponent<FormControlValue extends TNmcsMultiSelectValue | TNmcsSingleSelectValue>
  extends NmcsInput<FormControlValue>
  implements OnDestroy
{
  protected readonly dateControl = new FormControl<Date | null>(null, [Validators.required]);
  private hourControlValueSubscription: Subscription | null = null;
  private hourControlStatusSubscription: Subscription | null = null;
  protected readonly hourOptions = computed(() => {
    const locale = this.matDateLocale || 'en-US';
    const hour12 = this.isTwelveHour ? this.isTwelveHour() : twelveHourLocales.includes(locale);
    const formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hour12,
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const date = new Date(2000, 0, 1, hour);

      return {
        id: hour,
        name: formatter.format(date),
      };
    });
  });

  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) private matDateLocale: string,
    @Optional() @Inject(NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR) private isTwelveHour: Signal<boolean> | undefined,
  ) {
    super();

    this.registerHourToDateValueSync();
    this.registerDateToHourValueSync();
    this.syncControlStatus();
  }

  private registerHourToDateValueSync(): void {
    effect(() => {
      this.hourControlValueSubscription?.unsubscribe();
      const formControl = this.formControl();
      this.hourControlValueSubscription = formControl.valueChanges
        .pipe(startWith(formControl.value), distinctUntilChanged())
        .subscribe((hour) => {
          if (Array.isArray(hour)) {
            return;
          }

          if (hour === null) {
            this.dateControl.setValue(null, { emitEvent: false });

            return;
          }

          const current = this.dateControl.value ?? new Date();
          const updated = new Date(current);
          updated.setHours(hour, 0, 0, 0);
          this.dateControl.setValue(updated, { emitEvent: false });
        });
    });
  }

  private registerDateToHourValueSync(): void {
    this.dateControl.valueChanges
      .pipe(
        startWith(this.dateControl.value),
        distinctUntilChanged((a, b) => a?.getHours() === b?.getHours()),
        takeUntilDestroyed(),
      )
      .subscribe((date) => {
        const hour = date?.getHours() ?? null;
        (this.formControl() as FormControl<number | null>).setValue(hour);
      });
  }

  private syncControlStatus(): void {
    effect(() => {
      this.hourControlStatusSubscription?.unsubscribe();
      this.hourControlStatusSubscription = this.formControl().statusChanges.subscribe(() => {
        this.copyStatus(this.formControl(), this.dateControl);
      });
    });

    this.dateControl.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.copyStatus(this.dateControl, this.formControl());
    });
  }

  private copyStatus(from: FormControl, to: FormControl): void {
    if (from.disabled && !to.disabled) {
      to.disable({ emitEvent: false });
    } else if (!from.disabled && to.disabled) {
      to.enable({ emitEvent: false });
    }

    if (from.touched && !to.touched) {
      to.markAsTouched({ onlySelf: true });
    }

    if (from.dirty && !to.dirty) {
      to.markAsDirty({ onlySelf: true });
    }
  }

  public ngOnDestroy(): void {
    this.hourControlValueSubscription?.unsubscribe();
    this.hourControlStatusSubscription?.unsubscribe();
  }
}
