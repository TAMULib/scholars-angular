import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { ProfileSummariesExportComponent } from './profile-summaries-export.component';

import { testAppConfig } from '../../../test.config';
import { Layout } from '../../core/model/view';
import { ContainerType } from '../../core/model/view/data-and-analytics-view';
import { Side } from '../../core/model/view/display-view';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';

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
        TranslateModule.forRoot(),
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileSummariesExportComponent);
    component = fixture.componentInstance;
    component.document = {
      id: 'n000001',
      type: ['Test']
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
