import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewStepModalComponent } from './new-step-modal.component';

describe('NewStepModalComponent', () => {
  let component: NewStepModalComponent;
  let fixture: ComponentFixture<NewStepModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewStepModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewStepModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
