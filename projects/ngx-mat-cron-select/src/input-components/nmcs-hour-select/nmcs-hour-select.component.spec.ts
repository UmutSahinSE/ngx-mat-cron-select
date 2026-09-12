import { Signal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldTree, form } from '@angular/forms/signals';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR } from '../../tokens';
import { NmcsHourSelectComponent } from './nmcs-hour-select.component';

interface IHourOption {
  id: number;
  name: string;
}

function createFixture<FormControlValue extends number[] | number | null>(
  fieldValue: FormControlValue,
  providers: unknown[] = [],
): ComponentFixture<NmcsHourSelectComponent<FormControlValue>> {
  TestBed.configureTestingModule({
    imports: [NmcsHourSelectComponent],
    providers: [provideNativeDateAdapter(), ...providers],
  });

  const fixture = TestBed.createComponent(NmcsHourSelectComponent<FormControlValue>);
  fixture.componentRef.setInput(
    'field',
    TestBed.runInInjectionContext(() => form(signal(fieldValue))),
  );
  fixture.componentRef.setInput(
    'periodicCheckboxFieldTree',
    TestBed.runInInjectionContext(() => form(signal(false))),
  );
  fixture.componentRef.setInput(
    'periodicStepFieldTree',
    TestBed.runInInjectionContext(() => form(signal(1))),
  );
  fixture.componentRef.setInput('isPeriodicCheckboxVisible', true);
  fixture.detectChanges();

  return fixture;
}

function dateFieldTreeOf<FormControlValue extends number[] | number | null>(
  component: NmcsHourSelectComponent<FormControlValue>,
): FieldTree<Date | null | undefined> | undefined {
  return (
    component as unknown as {
      dateFieldTree: Signal<FieldTree<Date | null | undefined> | undefined>;
    }
  ).dateFieldTree();
}

function hourOptionsOf<FormControlValue extends number[] | number | null>(
  component: NmcsHourSelectComponent<FormControlValue>,
): IHourOption[] {
  return (component as unknown as { hourOptions: Signal<IHourOption[]> }).hourOptions();
}

describe('NmcsHourSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture<number | null>(null);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('reports isMultiselect true for an array-backed field', () => {
    const fixture = createFixture<number[]>([]);

    expect(fixture.componentInstance.isMultiselect()).toBeTrue();
  });

  it('reports isMultiselect false for a scalar-backed field', () => {
    const fixture = createFixture<number | null>(null);

    expect(fixture.componentInstance.isMultiselect()).toBeFalse();
  });

  describe('date <-> hour synchronization', () => {
    it('derives a Date at the given hour when the field starts with a numeric value', () => {
      const fixture = createFixture<number | null>(10);
      const dateFieldTree = dateFieldTreeOf(fixture.componentInstance);

      expect(dateFieldTree!().value()!.getHours()).toBe(10);
    });

    it('derives a null date when the field starts as null', () => {
      const fixture = createFixture<number | null>(null);
      const dateFieldTree = dateFieldTreeOf(fixture.componentInstance);

      expect(dateFieldTree!().value()).toBeNull();
    });

    it('propagates a new date back onto the field as an hour', () => {
      const fixture = createFixture<number | null>(10);
      const dateFieldTree = dateFieldTreeOf(fixture.componentInstance);
      const newDate = new Date();
      newDate.setHours(14, 0, 0, 0);

      dateFieldTree!().value.set(newDate);
      fixture.detectChanges();

      expect(fixture.componentInstance.field()().value()).toBe(14);
    });

    it('propagates a null date back onto the field as null', () => {
      const fixture = createFixture<number | null>(10);
      const dateFieldTree = dateFieldTreeOf(fixture.componentInstance);

      dateFieldTree!().value.set(null);
      fixture.detectChanges();

      expect(fixture.componentInstance.field()().value()).toBeNull();
    });

    it('propagates touched/dirty state from the internal date field onto the outer field', () => {
      const fixture = createFixture<number | null>(10);
      const dateFieldTree = dateFieldTreeOf(fixture.componentInstance);

      dateFieldTree!().markAsTouched();
      dateFieldTree!().markAsDirty();
      fixture.detectChanges();

      expect(fixture.componentInstance.field()().touched()).toBeTrue();
      expect(fixture.componentInstance.field()().dirty()).toBeTrue();
    });
  });

  describe('hourOptions', () => {
    it('exposes 24 entries', () => {
      const fixture = createFixture<number | null>(null);

      expect(hourOptionsOf(fixture.componentInstance).length).toBe(24);
    });

    it('uses 12-hour formatting for a twelve-hour locale when no override token is provided', () => {
      const fixture = createFixture<number | null>(null, [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }]);
      const options = hourOptionsOf(fixture.componentInstance);

      expect(options[1].name).toBe('1 AM');
    });

    it('uses 24-hour formatting for a non-twelve-hour locale when no override token is provided', () => {
      const fixture = createFixture<number | null>(null, [{ provide: MAT_DATE_LOCALE, useValue: 'de-DE' }]);
      const options = hourOptionsOf(fixture.componentInstance);

      expect(options[1].name).toBe('01 Uhr');
    });

    it('lets NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR force 12-hour formatting regardless of locale', () => {
      const fixture = createFixture<number | null>(null, [
        { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
        { provide: NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR, useValue: signal(true) },
      ]);
      const options = hourOptionsOf(fixture.componentInstance);

      expect(options[1].name).toBe('1 AM');
    });

    it('lets NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR force 24-hour formatting regardless of locale', () => {
      const fixture = createFixture<number | null>(null, [
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        { provide: NGX_MAT_CRON_SELECT_IS_TWELVE_HOUR, useValue: signal(false) },
      ]);
      const options = hourOptionsOf(fixture.componentInstance);

      expect(options[1].name).toBe('01');
    });
  });
});
