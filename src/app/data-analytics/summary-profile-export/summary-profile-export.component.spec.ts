import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryProfileExportComponent } from './summary-profile-export.component';

describe('SummaryProfileExportComponent', () => {
  let component: SummaryProfileExportComponent;
  let fixture: ComponentFixture<SummaryProfileExportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SummaryProfileExportComponent]
    });
    fixture = TestBed.createComponent(SummaryProfileExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
