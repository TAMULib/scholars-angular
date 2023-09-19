import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { queueScheduler, scheduled } from 'rxjs';

import { testAppConfig } from '../../../test.config';
import { APP_CONFIG } from '../../app.config';
import { metaReducers, reducers } from '../../core/store';
import { routes } from '../data-and-analytics.routes';
import { AcademicAgeGroupComponent } from './academic-age-group.component';
import { DataAndAnalyticsModule } from '../data-and-analytics.module';

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
              data: scheduled([{ document: { id: 'test', name: 'Test' } }], queueScheduler)
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
      name: 'Test'
    };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
