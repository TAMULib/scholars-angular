import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../../test.config';
import { Role } from '../../../core/model/user';
import { metaReducers, reducers } from '../../../core/store';
import { SharedModule } from '../../shared.module';
import { UserEditComponent } from './user-edit.component';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
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
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    component.user = {
      firstName: '',
      lastName: '',
      email: '',
      role: Role.ROLE_USER,
      active: false,
      enabled: false,
      _links: undefined,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
