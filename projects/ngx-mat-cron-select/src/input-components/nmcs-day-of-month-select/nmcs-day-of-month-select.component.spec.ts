import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { NmcsDayOfMonthSelectComponent } from './nmcs-day-of-month-select.component';

function createFixture<FormControlValue extends number[] | number | null>(
  fieldValue: FormControlValue,
): ComponentFixture<NmcsDayOfMonthSelectComponent<FormControlValue>> {
  TestBed.configureTestingModule({ imports: [NmcsDayOfMonthSelectComponent] });

  const fixture = TestBed.createComponent(NmcsDayOfMonthSelectComponent<FormControlValue>);
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

function optionsOf(component: NmcsDayOfMonthSelectComponent<number[]>): number[] {
  return (component as unknown as { options: number[] }).options;
}

function stepOptionsOf(component: NmcsDayOfMonthSelectComponent<number[]>): number[] {
  return (component as unknown as { stepOptions: number[] }).stepOptions;
}

describe('NmcsDayOfMonthSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture<number[]>([]);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes exactly the days 1 through 31, in order', () => {
    const fixture = createFixture<number[]>([]);

    expect(optionsOf(fixture.componentInstance)).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
  });

  it('reports isMultiselect true for an array-backed field', () => {
    const fixture = createFixture<number[]>([]);

    expect(fixture.componentInstance.isMultiselect()).toBeTrue();
  });

  it('reports isMultiselect false for a scalar-backed field', () => {
    const fixture = createFixture<number | null>(null);

    expect(fixture.componentInstance.isMultiselect()).toBeFalse();
  });

  it('exposes step options 1 through 31, matching the number of day options', () => {
    const fixture = createFixture<number[]>([]);

    expect(stepOptionsOf(fixture.componentInstance)).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
  });
});
