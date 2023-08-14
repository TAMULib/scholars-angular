import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { ProfileSummariesExportComponent } from './profile-summaries-export.component';

import { testAppConfig } from '../../../test.config';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';
import { of } from 'rxjs';

describe('ProfileSummariesExportComponent', () => {
  let component: ProfileSummariesExportComponent;
  let fixture: ComponentFixture<ProfileSummariesExportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileSummariesExportComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot(reducers(testAppConfig), {
          metaReducers,
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false,
            strictStateSerializability: false,
            strictActionSerializability: false,
          },
        }),
        RouterTestingModule.withRoutes([]),
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSummariesExportComponent);
    component = fixture.componentInstance;
    component.document = of();
    component.displayView = of();
    component.dataAndAnalyticsView = of();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
