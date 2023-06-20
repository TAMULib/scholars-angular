import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { testAppConfig } from '../../../test.config';
import { metaReducers, reducers } from '../../core/store';
import { VisualizationModule } from '../visualization.module';
import { routes } from '../visualization.routes';
import { BarplotComponent } from './barplot.component';

describe('BarplotComponent', () => {
  let component: BarplotComponent;
  let fixture: ComponentFixture<BarplotComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BarplotComponent],
      imports: [
        VisualizationModule,
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
    fixture = TestBed.createComponent(BarplotComponent);
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
