import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { TranslateModule } from '@ngx-translate/core';

import { testAppConfig } from '../../../test.config';
import { getRequest } from '../../app.browser.module';
import { Layout } from '../../core/model/view';
import { ContainerType } from '../../core/model/view/data-and-analytics-view';
import { Side } from '../../core/model/view/display-view';
import { RestService } from '../../core/service/rest.service';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';
import { ProfileSummariesExportComponent } from './profile-summaries-export.component';

describe('ProfileSummariesExportComponent', () => {
  let component: ProfileSummariesExportComponent;
  let fixture: ComponentFixture<ProfileSummariesExportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileSummariesExportComponent],
      imports: [
        SharedModule,
        HttpClientTestingModule,
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
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: REQUEST, useFactory: getRequest },
        RestService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSummariesExportComponent);
    component = fixture.componentInstance;
    component.organization = {
      id: 'n000001',
      type: [],
      class: 'Organization',
      name: 'Test',
    };
    component.displayView = {
      name: 'Test',
      types: [],
      mainContentTemplate: '',
      leftScanTemplate: '',
      rightScanTemplate: '',
      asideTemplate: '',
      asideLocation: Side.LEFT,
      exportViews: [],
      metaTemplates: {},
      tabs: []
    };
    component.dataAndAnalyticsView = {
      name: 'Test',
      layout: Layout.CONTAINER,
      type: ContainerType.PROFILE_SUMMARIES_EXPORT,
      templates: {},
      styles: [],
      fields: [],
      facets: [],
      filters: [],
      boosts: [],
      sort: [],
      export: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
