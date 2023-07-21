import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicAgeGroupComponent } from './academic-age-group.component';

describe('AcademicAgeGroupComponent', () => {
  let component: AcademicAgeGroupComponent;
  let fixture: ComponentFixture<AcademicAgeGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AcademicAgeGroupComponent]
    });
    fixture = TestBed.createComponent(AcademicAgeGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
