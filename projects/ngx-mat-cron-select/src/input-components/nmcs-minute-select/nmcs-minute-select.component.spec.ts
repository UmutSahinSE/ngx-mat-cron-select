import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NmcsMinuteSelectComponent } from './nmcs-minute-select.component';

describe('NmcsMinuteSelectComponent', () => {
  let component: NmcsMinuteSelectComponent;
  let fixture: ComponentFixture<NmcsMinuteSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NmcsMinuteSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NmcsMinuteSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
