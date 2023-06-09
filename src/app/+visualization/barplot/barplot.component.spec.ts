import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarplotComponent } from './barplot.component';

describe('BarplotComponent', () => {
  let component: BarplotComponent;
  let fixture: ComponentFixture<BarplotComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BarplotComponent]
    });
    fixture = TestBed.createComponent(BarplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
