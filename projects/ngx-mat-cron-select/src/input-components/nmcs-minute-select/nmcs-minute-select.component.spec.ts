import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { NmcsMinuteSelectComponent } from './nmcs-minute-select.component';

function createFixture<FormControlValue extends number[] | number | null>(
  fieldValue: FormControlValue,
): ComponentFixture<NmcsMinuteSelectComponent<FormControlValue>> {
  TestBed.configureTestingModule({ imports: [NmcsMinuteSelectComponent] });

  const fixture = TestBed.createComponent(NmcsMinuteSelectComponent<FormControlValue>);
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

function minuteOptionsOf(component: NmcsMinuteSelectComponent<number[]>): number[] {
  return (component as unknown as { minuteOptions: number[] }).minuteOptions;
}

function stepOptionsOf(component: NmcsMinuteSelectComponent<number[]>): number[] {
  return (component as unknown as { stepOptions: number[] }).stepOptions;
}

describe('NmcsMinuteSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture<number[]>([]);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes exactly the minutes 0 through 59, in order', () => {
    const fixture = createFixture<number[]>([]);

    expect(minuteOptionsOf(fixture.componentInstance)).toEqual(Array.from({ length: 60 }, (_, index) => index));
  });

  it('reports isMultiselect true for an array-backed field', () => {
    const fixture = createFixture<number[]>([]);

    expect(fixture.componentInstance.isMultiselect()).toBeTrue();
  });

  it('reports isMultiselect false for a scalar-backed field', () => {
    const fixture = createFixture<number | null>(null);

    expect(fixture.componentInstance.isMultiselect()).toBeFalse();
  });

  it('exposes step options 1 through 60, matching the number of minute options', () => {
    const fixture = createFixture<number[]>([]);

    expect(stepOptionsOf(fixture.componentInstance)).toEqual(Array.from({ length: 60 }, (_, index) => index + 1));
  });
});
