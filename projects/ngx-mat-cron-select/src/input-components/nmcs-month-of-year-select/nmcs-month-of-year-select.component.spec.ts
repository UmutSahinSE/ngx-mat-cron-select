import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NmcsMonthOfYearSelectComponent } from './nmcs-month-of-year-select.component';

describe('NmcsDayOfWeekSelectComponent', () => {
  let component: NmcsMonthOfYearSelectComponent;
  let fixture: ComponentFixture<NmcsMonthOfYearSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NmcsMonthOfYearSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NmcsMonthOfYearSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
