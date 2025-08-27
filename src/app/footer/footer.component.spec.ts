import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../test.config';
import { DialogService } from '../core/service/dialog.service';
import { metaReducers, reducers } from '../core/store';
import { FooterComponent } from './footer.component';
import { APP_CONFIG } from '../app.config';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FooterComponent],
      imports: [
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
      providers: [
        { provide: APP_CONFIG, useValue: testAppConfig },
        DialogService
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
