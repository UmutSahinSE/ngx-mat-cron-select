import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { NGX_MAT_CRON_SELECT_MONTH_FORMAT } from '../../tokens';
import { NmcsMonthOfYearSelectComponent } from './nmcs-month-of-year-select.component';

interface IMonthOption {
  cronValue: number;
  label: string;
}

function createFixture<FormControlValue extends number[] | number | null = number[]>(
  providers: unknown[] = [],
  fieldValue: FormControlValue = [] as unknown as FormControlValue,
): ComponentFixture<NmcsMonthOfYearSelectComponent<FormControlValue>> {
  TestBed.configureTestingModule({
    imports: [NmcsMonthOfYearSelectComponent],
    providers,
  });

  const fixture = TestBed.createComponent(NmcsMonthOfYearSelectComponent<FormControlValue>);
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

function optionsOf(component: NmcsMonthOfYearSelectComponent<number[]>): IMonthOption[] {
  return (component as unknown as { options: IMonthOption[] }).options;
}

describe('NmcsMonthOfYearSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes 12 months in order with cronValue 0 through 11', () => {
    const fixture = createFixture([{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }]);
    const options = optionsOf(fixture.componentInstance);

    expect(options.map((option) => option.cronValue)).toEqual(Array.from({ length: 12 }, (_, index) => index));
    expect(options[0].label).toBe('January');
  });

  it('defaults to en-US when MAT_DATE_LOCALE is not provided', () => {
    const fixture = createFixture();
    const options = optionsOf(fixture.componentInstance);

    expect(options[0].label).toBe('January');
  });

  it('uses NGX_MAT_CRON_SELECT_MONTH_FORMAT to control the month label format', () => {
    const fixture = createFixture([
      { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
      { provide: NGX_MAT_CRON_SELECT_MONTH_FORMAT, useValue: 'short' },
    ]);
    const options = optionsOf(fixture.componentInstance);

    expect(options[0].label).toBe('Jan');
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
