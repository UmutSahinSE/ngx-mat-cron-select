import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NmcsHourSelectComponent } from './nmcs-hour-select.component';

describe('NmcsHourSelectComponent', () => {
  let component: NmcsHourSelectComponent;
  let fixture: ComponentFixture<NmcsHourSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NmcsHourSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NmcsHourSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
