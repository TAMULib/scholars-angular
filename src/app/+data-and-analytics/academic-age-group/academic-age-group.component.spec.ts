import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { queueScheduler, scheduled } from 'rxjs';

import { testAppConfig } from '../../../test.config';
import { APP_CONFIG } from '../../app.config';
import { Layout } from '../../core/model/view';
import { ContainerType } from '../../core/model/view/data-and-analytics-view';
import { Side } from '../../core/model/view/display-view';
import { metaReducers, reducers } from '../../core/store';
import { DataAndAnalyticsModule } from '../data-and-analytics.module';
import { routes } from '../data-and-analytics.routes';
import { AcademicAgeGroupComponent } from './academic-age-group.component';

describe('AcademicAgeGroupComponent', () => {
  let component: AcademicAgeGroupComponent;
  let fixture: ComponentFixture<AcademicAgeGroupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AcademicAgeGroupComponent],
      imports: [
        DataAndAnalyticsModule,
        StoreModule.forRoot(reducers(testAppConfig), {
          metaReducers,
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false,
            strictStateSerializability: false,
            strictActionSerializability: false,
          },
        }),
        RouterTestingModule.withRoutes(routes),
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: APP_CONFIG, useValue: testAppConfig },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              params: scheduled([{ collection: 'individual', id: 'test' }], queueScheduler),
              data: scheduled([{ individual: { id: 'test', name: 'Test' } }], queueScheduler)
            },
          },
        },
        TranslateService
      ],
    });
    fixture = TestBed.createComponent(AcademicAgeGroupComponent);
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
      type: ContainerType.ACADEMIC_AGE_GROUP,
      layout: Layout.CONTAINER,
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
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
