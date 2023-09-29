import { APP_BASE_HREF } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../test.config';
import { DialogService } from '../../core/service/dialog.service';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';
import { DataAndAnalyticsViewsComponent } from './data-and-analytics-views.component';

describe('DataAndAnalyticsViewsComponent', () => {
  let component: DataAndAnalyticsViewsComponent;
  let fixture: ComponentFixture<DataAndAnalyticsViewsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DataAndAnalyticsViewsComponent],
      providers: [
        DialogService,
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
      imports: [
        NoopAnimationsModule,
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
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataAndAnalyticsViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
