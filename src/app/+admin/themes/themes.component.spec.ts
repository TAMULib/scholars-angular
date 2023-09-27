import { APP_BASE_HREF } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../test.config';
import { CoreModule } from '../../core/core.module';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';
import { ThemesComponent } from './themes.component';

describe('ThemesComponent', () => {
  let component: ThemesComponent;
  let fixture: ComponentFixture<ThemesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemesComponent],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
      imports: [
        NoopAnimationsModule,
        CoreModule,
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
    fixture = TestBed.createComponent(ThemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
