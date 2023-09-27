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
import { DisplayViewsComponent } from './display-views.component';

describe('DisplayViewsComponent', () => {
  let component: DisplayViewsComponent;
  let fixture: ComponentFixture<DisplayViewsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayViewsComponent],
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
    fixture = TestBed.createComponent(DisplayViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
