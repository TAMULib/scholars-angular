import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { SummaryProfileExportComponent } from './summary-profile-export.component';

import { testAppConfig } from '../../../test.config';
import { metaReducers, reducers } from '../../core/store';

describe('SummaryProfileExportComponent', () => {
  let component: SummaryProfileExportComponent;
  let fixture: ComponentFixture<SummaryProfileExportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SummaryProfileExportComponent],
      imports: [
        StoreModule.forRoot(reducers(testAppConfig), {
          metaReducers,
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false,
            strictStateSerializability: false,
            strictActionSerializability: false,
          },
        })
      ]
    });
    fixture = TestBed.createComponent(SummaryProfileExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
