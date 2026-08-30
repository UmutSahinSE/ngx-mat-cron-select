import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { NGX_MAT_CRON_SELECT_WEEK_FORMAT } from '../../tokens';
import { NmcsDayOfWeekSelectComponent } from './nmcs-day-of-week-select.component';

interface IWeekdayOption {
  cronValue: number;
  label: string;
}

function createFixture<FormControlValue extends number[] | number | null = number[]>(
  providers: unknown[] = [],
  fieldValue: FormControlValue = [] as unknown as FormControlValue,
): ComponentFixture<NmcsDayOfWeekSelectComponent<FormControlValue>> {
  TestBed.configureTestingModule({
    imports: [NmcsDayOfWeekSelectComponent],
    providers,
  });

  const fixture = TestBed.createComponent(NmcsDayOfWeekSelectComponent<FormControlValue>);
  fixture.componentRef.setInput(
    'field',
    TestBed.runInInjectionContext(() => form(signal(fieldValue))),
  );
  fixture.componentRef.setInput(
    'checkboxFieldTree',
    TestBed.runInInjectionContext(() => form(signal(false))),
  );
  fixture.componentRef.setInput('isCheckboxVisible', true);
  fixture.detectChanges();

  return fixture;
}

function optionsOf(component: NmcsDayOfWeekSelectComponent<number[]>): IWeekdayOption[] {
  return (component as unknown as { options: IWeekdayOption[] }).options;
}

describe('NmcsDayOfWeekSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('orders days starting from Sunday (cronValue 0) for en-US, preserving original cron values', () => {
    const fixture = createFixture([{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }]);
    const options = optionsOf(fixture.componentInstance);

    expect(options.map((option) => option.cronValue)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(options[0].label).toBe('Sunday');
  });

  it('reorders days starting from the locale week start, without altering cronValue', () => {
    const fixture = createFixture([{ provide: MAT_DATE_LOCALE, useValue: 'de-DE' }]);
    const options = optionsOf(fixture.componentInstance);

    expect(options.map((option) => option.cronValue)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('defaults to en-US when MAT_DATE_LOCALE is not provided', () => {
    const fixture = createFixture();
    const options = optionsOf(fixture.componentInstance);

    expect(options.map((option) => option.cronValue)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('defaults the weekday format to "long" when NGX_MAT_CRON_SELECT_WEEK_FORMAT is not provided', () => {
    const fixture = createFixture([{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }]);
    const options = optionsOf(fixture.componentInstance);

    expect(options[0].label).toBe('Sunday');
  });

  it('uses NGX_MAT_CRON_SELECT_WEEK_FORMAT to control the weekday label format', () => {
    const fixture = createFixture([
      { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
      { provide: NGX_MAT_CRON_SELECT_WEEK_FORMAT, useValue: 'short' },
    ]);
    const options = optionsOf(fixture.componentInstance);

    expect(options[0].label).toBe('Sun');
  });

  it('reports isMultiselect true for an array-backed field', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance.isMultiselect()).toBeTrue();
  });

  it('reports isMultiselect false for a scalar-backed field', () => {
    const fixture = createFixture<number | null>([], null);

    expect(fixture.componentInstance.isMultiselect()).toBeFalse();
  });
});
