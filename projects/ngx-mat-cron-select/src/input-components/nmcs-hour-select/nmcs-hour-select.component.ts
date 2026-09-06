import { AsyncPipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  linkedSignal,
  OnInit,
  runInInjectionContext,
  signal,
  Signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { disabled, Field, FieldTree, form, required } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
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
import { twelveHourLocales } from '../../lib/ngx-mat-cron-select.interface';
import { NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR } from '../../tokens';
import { TranslateOrUseDefaultPipe } from '../../translate-or-use-default.pipe';
import { TNmcsValue } from '../nmcs-input.interface';

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
    MatFormFieldModule,
    MatSelect,
    AsyncPipe,
    MatCheckbox,
    Field,
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
export class NmcsHourSelectComponent<FormControlValue extends TNmcsValue> implements OnInit {
  private readonly matDateLocale = inject<string>(MAT_DATE_LOCALE, { optional: true });
  private readonly isTwelveHour = inject<Signal<boolean>>(NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR, { optional: true });
  private readonly injector = inject(Injector);

  public readonly field = input.required<FieldTree<FormControlValue>>();
  public readonly checkboxFieldTree = input.required<FieldTree<boolean> | null>();
  public readonly isCheckboxVisible = input.required<boolean>();

  public readonly isMultiselect = computed(() => Array.isArray(this.field()().value()));

  private readonly dateField = linkedSignal(() => {
    const fieldValue = this.field()().value();

    if (Array.isArray(fieldValue)) {
      return undefined;
    }

    if (fieldValue === null) {
      return null;
    }

    const date = new Date();
    date.setHours(fieldValue, 0, 0, 0);

    return date;
  });

  protected readonly dateFieldTree = signal<FieldTree<Date | null | undefined> | undefined>(undefined);
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

  constructor() {
    this.registerDateToHourValueSync();
  }

  public ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      this.dateFieldTree.set(
        form(this.dateField, (schema) => {
          required(schema);
          disabled(schema, this.field()().disabled);
        }),
      );

      this.syncControlStatus();
    });
  }

  private registerDateToHourValueSync(): void {
    effect(() => {
      const dateFieldValue = this.dateField();

      if (dateFieldValue === undefined) {
        return;
      }

      const hour = dateFieldValue?.getHours() ?? null;
      // @ts-ignore
      this.field()().setControlValue(hour as FormControlValue);
    });
  }

  private syncControlStatus(): void {
    effect(() => {
      if (this.dateFieldTree()!().touched()) {
        this.field()().markAsTouched();
      }

      if (this.dateFieldTree()!().dirty()) {
        this.field()().markAsDirty();
      }
    });
  }
}
