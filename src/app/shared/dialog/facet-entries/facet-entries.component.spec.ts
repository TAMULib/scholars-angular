import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../../test.config';
import { getRequest } from '../../../app.browser.module';
import { APP_CONFIG } from '../../../app.config';
import { IndividualRepo } from '../../../core/model/discovery/repo/individual.repo';
import { RestService } from '../../../core/service/rest.service';
import { metaReducers, reducers } from '../../../core/store';
import { SharedModule } from '../../shared.module';
import { FacetEntriesComponent } from './facet-entries.component';

describe('FacetEntriesComponent', () => {
  let component: FacetEntriesComponent;
  let fixture: ComponentFixture<FacetEntriesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
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
      providers: [
        { provide: REQUEST, useFactory: getRequest },
        { provide: APP_CONFIG, useValue: testAppConfig },
        RestService,
        IndividualRepo
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FacetEntriesComponent);
    component = fixture.componentInstance;
    component.name = 'Test';
    component.field = 'test';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
