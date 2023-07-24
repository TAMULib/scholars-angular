import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../test.config';
import { APP_CONFIG } from '../app.config';
import { metaReducers, reducers } from '../core/store';
import { SharedModule } from '../shared/shared.module';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { DataAnalyticsComponent } from './data-analytics.component';

import { routes } from './data-analytics.routes';

describe('DataAnalyticsComponent', () => {
  let component: DataAnalyticsComponent;
  let fixture: ComponentFixture<DataAnalyticsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DataAnalyticsComponent],
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
        RouterTestingModule.withRoutes(routes),
      ],
      providers: [{ provide: APP_CONFIG, useValue: testAppConfig }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
