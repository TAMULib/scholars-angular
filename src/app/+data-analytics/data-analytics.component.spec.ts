import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataAnalyticsComponent } from './data-analytics.component';

describe('DataAnalyticsComponent', () => {
  let component: DataAnalyticsComponent;
  let fixture: ComponentFixture<DataAnalyticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataAnalyticsComponent]
    });
    fixture = TestBed.createComponent(DataAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
