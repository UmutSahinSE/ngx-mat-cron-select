import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NmcsDayOfWeekSelectComponent } from './nmcs-day-of-week-select.component';

describe('NmcsDayOfWeekSelectComponent', () => {
  let component: NmcsDayOfWeekSelectComponent;
  let fixture: ComponentFixture<NmcsDayOfWeekSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NmcsDayOfWeekSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NmcsDayOfWeekSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
