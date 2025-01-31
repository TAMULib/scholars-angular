import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { testAppConfig } from '../../../../test.config';
import { metaReducers, reducers } from '../../../core/store';
import { DataAndAnalyticsModule } from '../../data-and-analytics.module';
import { routes } from '../../data-and-analytics.routes';
import { ScatterplotComponent } from './scatterplot.component';

describe('ScatterplotComponent', () => {
  let component: ScatterplotComponent;
  let fixture: ComponentFixture<ScatterplotComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ScatterplotComponent],
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
        TranslateService
      ],
    });
    fixture = TestBed.createComponent(ScatterplotComponent);
    component = fixture.componentInstance;
    component.input = of({
      label: 'Test',
      data: []
    });
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
