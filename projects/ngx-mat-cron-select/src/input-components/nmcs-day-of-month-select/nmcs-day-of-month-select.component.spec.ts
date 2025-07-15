import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NmcsDayOfMonthSelectComponent } from './nmcs-day-of-month-select.component';

describe('NmcsMinuteSelectComponent', () => {
  let component: NmcsDayOfMonthSelectComponent;
  let fixture: ComponentFixture<NmcsDayOfMonthSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NmcsDayOfMonthSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NmcsDayOfMonthSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
