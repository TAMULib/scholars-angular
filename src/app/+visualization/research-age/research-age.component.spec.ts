import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchAgeComponent } from './research-age.component';

describe('ResearchAgeComponent', () => {
  let component: ResearchAgeComponent;
  let fixture: ComponentFixture<ResearchAgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResearchAgeComponent]
    });
    fixture = TestBed.createComponent(ResearchAgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
