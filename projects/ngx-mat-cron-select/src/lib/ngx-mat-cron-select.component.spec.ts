import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED } from '../tokens';
import { NgxMatCronSelectComponent } from './ngx-mat-cron-select.component';
import { IEveryCheckboxesFormGroupValue, IInputsFormGroup, ITab } from './ngx-mat-cron-select.interface';

@Component({
  imports: [NgxMatCronSelectComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ngx-mat-cron-select [initialValue]="cronValue()" (valueChange)="cronValue.set($event)"></ngx-mat-cron-select>
  `,
})
class HostFeedingValueChangeBackIntoInitialValue {
  public readonly cronValue = signal<string | null>('1 * 3 * *');
}

const allVisibleTabs: ITab = { day: true, hour: true, month: true, week: true, year: true };
const allVisibleCheckboxes: IEveryCheckboxesFormGroupValue = {
  day: true,
  hour: true,
  minute: true,
  monthOfYear: true,
};

function createFixture(
  inputs: {
    initialTab?: keyof ITab;
    initialValue?: string | null;
    isDisabled?: boolean;
    visibleTabs?: Partial<ITab>;
    repeatingCheckboxesVisibility?: Partial<IEveryCheckboxesFormGroupValue>;
  } = {},
  providers: unknown[] = [],
): ComponentFixture<NgxMatCronSelectComponent> {
  TestBed.configureTestingModule({
    imports: [NgxMatCronSelectComponent],
    providers: [provideNativeDateAdapter(), ...providers],
  });

  const fixture = TestBed.createComponent(NgxMatCronSelectComponent);

  if (inputs.initialTab !== undefined) {
    fixture.componentRef.setInput('initialTab', inputs.initialTab);
  }

  if (inputs.initialValue !== undefined) {
    fixture.componentRef.setInput('initialValue', inputs.initialValue);
  }

  if (inputs.isDisabled !== undefined) {
    fixture.componentRef.setInput('isDisabled', inputs.isDisabled);
  }

  if (inputs.visibleTabs !== undefined) {
    fixture.componentRef.setInput('visibleTabs', { ...allVisibleTabs, ...inputs.visibleTabs });
  }

  if (inputs.repeatingCheckboxesVisibility !== undefined) {
    fixture.componentRef.setInput('repeatingCheckboxesVisibility', {
      ...allVisibleCheckboxes,
      ...inputs.repeatingCheckboxesVisibility,
    });
  }

  fixture.detectChanges();

  return fixture;
}

function selectedTab(fixture: ComponentFixture<NgxMatCronSelectComponent>): keyof ITab {
  return (fixture.componentInstance as unknown as { selectedTab: () => keyof ITab }).selectedTab();
}

function monthAndDayOrder(fixture: ComponentFixture<NgxMatCronSelectComponent>): ('month' | 'day')[] {
  return (fixture.componentInstance as unknown as { monthAndDayOrder: ('month' | 'day')[] }).monthAndDayOrder;
}

function tabAnimationDuration(fixture: ComponentFixture<NgxMatCronSelectComponent>): string {
  return (fixture.componentInstance as unknown as { tabAnimationDuration: string }).tabAnimationDuration;
}

describe('NgxMatCronSelectComponent', () => {
  it('should create', () => {
    const fixture = createFixture();

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('tab selection', () => {
    it('defaults to the "year" tab when no initialValue and no manual selection are set', () => {
      const fixture = createFixture();

      expect(selectedTab(fixture)).toBe('year');
    });

    it('honors a custom initialTab when no initialValue is set', () => {
      const fixture = createFixture({ initialTab: 'hour' });

      expect(selectedTab(fixture)).toBe('hour');
    });

    it('falls back to the first visible tab (in ITab key order) when initialTab is hidden', () => {
      const fixture = createFixture({
        initialTab: 'year',
        visibleTabs: { day: true, hour: false, month: false, week: false, year: false },
      });

      expect(selectedTab(fixture)).toBe('day');
    });

    it('forces the hour tab visible when every tab is hidden', () => {
      const fixture = createFixture({
        visibleTabs: { day: false, hour: false, month: false, week: false, year: false },
      });

      expect(selectedTab(fixture)).toBe('hour');
    });

    const cronToExpectedTab: [string, keyof ITab][] = [
      ['30 * * * *', 'hour'],
      ['30 5 * * *', 'day'],
      ['30 5 * * 1', 'week'],
      ['30 5 1 * *', 'month'],
      ['30 5 1 1 *', 'year'],
    ];

    for (const [cron, expectedTab] of cronToExpectedTab) {
      it(`resolves "${cron}" to the "${expectedTab}" tab`, () => {
        const fixture = createFixture({ initialValue: cron });

        expect(selectedTab(fixture)).toBe(expectedTab);
      });
    }

    it('falls back through year/month/week/day/hour preference order when the cron-implied tab is hidden', () => {
      const fixture = createFixture({
        initialValue: '30 5 1 1 *',
        visibleTabs: { day: false, hour: false, month: true, week: false, year: false },
      });

      expect(selectedTab(fixture)).toBe('month');
    });

    it('maps setTab(index) onto the fixed hour/day/week/month/year order of visible tabs', () => {
      const fixture = createFixture();

      fixture.componentInstance.setTab(0);
      expect(selectedTab(fixture)).toBe('hour');

      fixture.componentInstance.setTab(2);
      expect(selectedTab(fixture)).toBe('week');

      fixture.componentInstance.setTab(4);
      expect(selectedTab(fixture)).toBe('year');
    });

    it('skips hidden tabs when mapping setTab(index)', () => {
      const fixture = createFixture({
        visibleTabs: { day: true, hour: false, month: true, week: true, year: true },
      });

      fixture.componentInstance.setTab(0);
      expect(selectedTab(fixture)).toBe('day');

      fixture.componentInstance.setTab(1);
      expect(selectedTab(fixture)).toBe('week');
    });

    it('lets manual tab selection take priority over the initialValue-derived tab', () => {
      const fixture = createFixture({ initialValue: '30 5 1 1 *' });

      expect(selectedTab(fixture)).toBe('year');

      fixture.componentInstance.setTab(0);

      expect(selectedTab(fixture)).toBe('hour');
    });
  });

  describe('cron parsing on initialValue', () => {
    it('round-trips an all-wildcard cron string, checking every applicable "every" checkbox', () => {
      const fixture = createFixture({ initialValue: '* * * * *' });
      const component = fixture.componentInstance;

      expect(component.value()).toBe('* * * * *');
      expect(component.repeatingCheckboxFieldTree().minute().value()).toBeTrue();
    });

    it('resets to the empty state when initialValue is null', () => {
      const fixture = createFixture({ initialValue: null });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
      expect(component.repeatingCheckboxFieldTree().minute().value()).toBeFalse();
    });

    it('populates every field from a fully-specified cron string, including fields inactive for the resolved tab', () => {
      const fixture = createFixture({ initialValue: '30 5 1 1 3' });
      const component = fixture.componentInstance;

      expect(selectedTab(fixture)).toBe('year');
      expect(component.inputsFormGroup().minute().value()).toEqual([30]);
      expect(component.inputsFormGroup().hour().value()).toEqual([5]);
      expect(component.inputsFormGroup().dayOfMonth().value()).toEqual([1]);
      expect(component.inputsFormGroup().monthOfYear().value()).toEqual([1]);
      expect(component.inputsFormGroup().dayOfWeek().value()).toEqual([3]);
    });

    it('ignores an initialValue with the wrong number of fields', () => {
      const fixture = createFixture({ initialValue: '30 5 1' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
    });

    it('ignores an initialValue with a non-numeric field', () => {
      const fixture = createFixture({ initialValue: 'not-a-number 5 1 1 3' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
    });

    it('ignores an initialValue with an out-of-range field (e.g. day-of-week 9)', () => {
      const fixture = createFixture({ initialValue: '30 5 1 1 9' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
      expect(component.inputsFormGroup().dayOfWeek().value()).toEqual([]);
    });
  });

  describe('using a consumer-provided inputsFormGroup', () => {
    it("keeps a consumer-provided inputsFormGroup's pre-populated values when initialValue is not set", () => {
      TestBed.configureTestingModule({
        imports: [NgxMatCronSelectComponent],
        providers: [provideNativeDateAdapter()],
      });
      const fixture = TestBed.createComponent(NgxMatCronSelectComponent);
      const customInputsFormGroup = TestBed.runInInjectionContext(() =>
        form(signal<IInputsFormGroup>({ dayOfMonth: [], dayOfWeek: [], hour: [], minute: [15], monthOfYear: [] })),
      );

      fixture.componentRef.setInput('initialTab', 'hour');
      fixture.componentRef.setInput('inputsFormGroup', customInputsFormGroup);
      fixture.detectChanges();

      expect(fixture.componentInstance.inputsFormGroup().minute().value()).toEqual([15]);
    });
  });

  describe('re-initialization triggers', () => {
    it('re-initializes when initialValue changes after creation', () => {
      const fixture = createFixture({ initialValue: '30 * * * *' });

      expect(fixture.componentInstance.inputsFormGroup().minute().value()).toEqual([30]);

      fixture.componentRef.setInput('initialValue', '45 * * * *');
      fixture.detectChanges();

      expect(fixture.componentInstance.inputsFormGroup().minute().value()).toEqual([45]);
    });

    it('does not wipe the form when a consumer feeds valueChange back into initialValue and a tab switch transiently makes the output null', () => {
      TestBed.configureTestingModule({
        imports: [HostFeedingValueChangeBackIntoInitialValue],
        providers: [provideNativeDateAdapter()],
      });
      const hostFixture = TestBed.createComponent(HostFeedingValueChangeBackIntoInitialValue);
      hostFixture.detectChanges();
      const cronSelect = hostFixture.debugElement.children[0].componentInstance as NgxMatCronSelectComponent;

      expect(cronSelect.inputsFormGroup().minute().value()).toEqual([1]);
      expect(cronSelect.inputsFormGroup().dayOfMonth().value()).toEqual([3]);

      cronSelect.setTab(2); // week — dayOfWeek becomes active and empty, making value() (and thus initialValue) null
      hostFixture.detectChanges();

      expect(hostFixture.componentInstance.cronValue()).toBeNull();
      expect(cronSelect.inputsFormGroup().minute().value()).toEqual([1]);
      expect(cronSelect.inputsFormGroup().dayOfMonth().value()).toEqual([3]);
    });

    it('still re-initializes when the consumer loads a genuinely different initialValue, even with the feedback binding in place', () => {
      TestBed.configureTestingModule({
        imports: [HostFeedingValueChangeBackIntoInitialValue],
        providers: [provideNativeDateAdapter()],
      });
      const hostFixture = TestBed.createComponent(HostFeedingValueChangeBackIntoInitialValue);
      hostFixture.detectChanges();
      const cronSelect = hostFixture.debugElement.children[0].componentInstance as NgxMatCronSelectComponent;

      hostFixture.componentInstance.cronValue.set('5 10 * * *');
      hostFixture.detectChanges();

      expect(cronSelect.inputsFormGroup().minute().value()).toEqual([5]);
      expect(cronSelect.inputsFormGroup().hour().value()).toEqual([10]);
    });
  });

  describe('computed value()', () => {
    it('reflects a real selection for the only active field as a matching cron string', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([5]);
      fixture.detectChanges();

      expect(component.value()).toBe('5 * * * *');
    });

    it('sorts multiselect values numerically in the rendered cron string', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([5, 1, 10]);
      fixture.detectChanges();

      expect(component.value()).toBe('1,5,10 * * * *');
    });

    it('emits "* * * * *" when every active checkbox is checked, even though the form is otherwise invalid', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      component.repeatingCheckboxFieldTree().minute().value.set(true);
      fixture.detectChanges();

      expect(component.value()).toBe('* * * * *');
    });

    it('is either null or a fully-formed 5-field cron string, never a partial/malformed string', () => {
      const fixture = createFixture({ initialTab: 'year' });
      const component = fixture.componentInstance;
      const cronPattern = /^(\*|\d+(,\d+)*) (\*|\d+(,\d+)*) (\*|\d+(,\d+)*) (\*|\d+(,\d+)*) (\*|\d+(,\d+)*)$/;

      for (const minuteValue of [[], [5], [5, 1]]) {
        component.inputsFormGroup().minute().value.set(minuteValue);
        fixture.detectChanges();

        const value = component.value();

        expect(value === null || cronPattern.test(value!)).toBeTrue();
      }
    });
  });

  describe('logical range validation on inputsFormGroup', () => {
    it('rejects an out-of-range day-of-week value (e.g. 9)', () => {
      const fixture = createFixture({ initialTab: 'week' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([30]);
      component.inputsFormGroup().hour().value.set([5]);
      component.inputsFormGroup().dayOfWeek().value.set([9]);
      fixture.detectChanges();

      expect(component.inputsFormGroup()().valid()).toBeFalse();
      expect(component.value()).toBeNull();
    });

    it('accepts an in-range day-of-week value (0-6)', () => {
      const fixture = createFixture({ initialTab: 'week' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([30]);
      component.inputsFormGroup().hour().value.set([5]);
      component.inputsFormGroup().dayOfWeek().value.set([3]);
      fixture.detectChanges();

      expect(component.inputsFormGroup()().valid()).toBeTrue();
      expect(component.value()).toBe('30 5 * * 3');
    });

    it('rejects an out-of-range minute value (e.g. 70)', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([70]);
      fixture.detectChanges();

      expect(component.inputsFormGroup()().valid()).toBeFalse();
      expect(component.value()).toBeNull();
    });

    it('does not validate range on a disabled (checkbox-checked) field', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      component.repeatingCheckboxFieldTree().minute().value.set(true);
      fixture.detectChanges();

      expect(component.inputsFormGroup().minute().disabled()).toBeTrue();
      expect(component.inputsFormGroup().minute().errors()).toEqual([]);
      expect(component.inputsFormGroup()().valid()).toBeTrue();
    });
  });

  describe('disabling cascade', () => {
    it('disables every field and checkbox when isDisabled is true', () => {
      const fixture = createFixture({ initialTab: 'year', isDisabled: true });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().disabled()).toBeTrue();
      expect(component.inputsFormGroup().hour().disabled()).toBeTrue();
      expect(component.repeatingCheckboxFieldTree().minute().disabled()).toBeTrue();
    });

    it('disables a field once its owning "every" checkbox is checked, and re-enables it when unchecked', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().disabled()).toBeFalse();

      component.repeatingCheckboxFieldTree().minute().value.set(true);
      fixture.detectChanges();
      expect(component.inputsFormGroup().minute().disabled()).toBeTrue();

      component.repeatingCheckboxFieldTree().minute().value.set(false);
      fixture.detectChanges();
      expect(component.inputsFormGroup().minute().disabled()).toBeFalse();
    });

    it('disables a checkbox not visible via repeatingCheckboxesVisibility', () => {
      const fixture = createFixture({
        initialTab: 'hour',
        repeatingCheckboxesVisibility: { minute: false },
      });

      expect(fixture.componentInstance.repeatingCheckboxFieldTree().minute().disabled()).toBeTrue();
    });

    it('disables fields that are inactive for the currently selected tab, and re-enables them once their auto-checked checkbox is unchecked', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().dayOfMonth().disabled()).toBeTrue();

      fixture.componentInstance.setTab(4);
      fixture.detectChanges();

      // dayOfMonth is now active, but its checkbox was auto-checked on reveal (see "tab-switch side effects"
      // below), so it stays disabled until the user unchecks it.
      expect(component.inputsFormGroup().dayOfMonth().disabled()).toBeTrue();

      component.repeatingCheckboxFieldTree().day().value.set(false);
      fixture.detectChanges();

      expect(component.inputsFormGroup().dayOfMonth().disabled()).toBeFalse();
    });
  });

  describe('valueChange output', () => {
    it('emits when a checked "every" checkbox changes the resulting cron string', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const emitted: (string | null)[] = [];
      fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

      fixture.componentInstance.repeatingCheckboxFieldTree().minute().value.set(true);
      fixture.detectChanges();

      expect(emitted).toEqual(['* * * * *']);
    });

    it('does not emit again when change detection runs with no actual value change', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const emitted: (string | null)[] = [];
      fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

      fixture.detectChanges();
      fixture.detectChanges();

      expect(emitted).toEqual([]);
    });

    it('emits again on a tab switch that changes the resulting cron string', () => {
      const fixture = createFixture({ initialTab: 'year' });
      const component = fixture.componentInstance;

      component.inputsFormGroup().minute().value.set([5]);
      component.inputsFormGroup().hour().value.set([10]);
      component.inputsFormGroup().dayOfMonth().value.set([15]);
      component.inputsFormGroup().monthOfYear().value.set([3]);
      fixture.detectChanges();

      expect(component.value()).toBe('5 10 15 3 *');

      const emitted: (string | null)[] = [];
      fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

      // Switching to the "hour" tab hides hour/dayOfMonth/monthOfYear, which always render as '*' once inactive
      // regardless of their (real, unchecked) values — so the output changes even though nothing was unset.
      fixture.componentInstance.setTab(0);
      fixture.detectChanges();

      expect(emitted.length).toBeGreaterThan(0);
      expect(emitted[emitted.length - 1]).toBe('5 * * * *');
    });
  });

  describe('tab-switch side effects on repeating checkboxes', () => {
    it('checks the newly-active field checkbox when a tab switch reveals it', () => {
      const fixture = createFixture({ initialTab: 'day' });
      const component = fixture.componentInstance;

      expect(selectedTab(fixture)).toBe('day');

      fixture.componentInstance.setTab(2);
      fixture.detectChanges();

      expect(selectedTab(fixture)).toBe('week');
      expect(component.repeatingCheckboxFieldTree().day().value()).toBeTrue();
    });
  });

  describe('tab animations configuration (NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED)', () => {
    it('defaults to enabling tab animations when the token is not provided', () => {
      const fixture = createFixture();

      expect(tabAnimationDuration(fixture)).toBe('500ms');
    });

    it('disables tab animations when the token is provided as true', () => {
      const fixture = createFixture({}, [{ provide: NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED, useValue: true }]);

      expect(tabAnimationDuration(fixture)).toBe('0ms');
    });

    it('keeps tab animations enabled when the token is explicitly provided as false', () => {
      const fixture = createFixture({}, [{ provide: NGX_MAT_CRON_SELECT_TAB_ANIMATIONS_DISABLED, useValue: false }]);

      expect(tabAnimationDuration(fixture)).toBe('500ms');
    });
  });

  describe('getMonthAndDayOrder', () => {
    it('orders month before day for en-US', () => {
      const fixture = createFixture({}, [{ provide: MAT_DATE_LOCALE, useValue: 'en-US' }]);

      expect(monthAndDayOrder(fixture)).toEqual(['month', 'day']);
    });

    it('orders day before month for a dd/mm-style locale', () => {
      const fixture = createFixture({}, [{ provide: MAT_DATE_LOCALE, useValue: 'de-DE' }]);

      expect(monthAndDayOrder(fixture)).toEqual(['day', 'month']);
    });
  });
});
