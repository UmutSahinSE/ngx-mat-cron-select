import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { NgxMatCronSelectComponent } from './ngx-mat-cron-select.component';
import { IEveryCheckboxesFormGroupValue, ITab } from './ngx-mat-cron-select.interface';

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

    it('ignores an initialValue with the wrong number of fields (suspected bug: validateInputCron is dead code)', () => {
      const fixture = createFixture({ initialValue: '30 5 1' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
    });

    it('ignores an initialValue with a non-numeric field (suspected bug: validateInputCron is dead code)', () => {
      const fixture = createFixture({ initialValue: 'not-a-number 5 1 1 3' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().minute().value()).toEqual([]);
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

    it('disables fields that are inactive for the currently selected tab', () => {
      const fixture = createFixture({ initialTab: 'hour' });
      const component = fixture.componentInstance;

      expect(component.inputsFormGroup().dayOfMonth().disabled()).toBeTrue();

      fixture.componentInstance.setTab(4);
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
      const fixture = createFixture({ initialTab: 'hour' });
      fixture.componentInstance.repeatingCheckboxFieldTree().minute().value.set(true);
      fixture.detectChanges();

      const emitted: (string | null)[] = [];
      fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));

      fixture.componentInstance.setTab(4);
      fixture.detectChanges();

      expect(emitted.length).toBeGreaterThan(0);
      expect(emitted[emitted.length - 1]).not.toBe('* * * * *');
    });
  });

  describe('tab-switch side effects on repeating checkboxes (suspected missing behavior)', () => {
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
