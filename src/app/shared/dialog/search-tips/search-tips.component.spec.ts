import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../../test.config';
import { metaReducers, reducers } from '../../../core/store';
import { SharedModule } from '../../shared.module';
import { SearchTipsComponent } from './search-tips.component';

describe('SearchTipsComponent', () => {
  let component: SearchTipsComponent;
  let fixture: ComponentFixture<SearchTipsComponent>;

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
    fixture = TestBed.createComponent(SearchTipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
