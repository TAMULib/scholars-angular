import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { queueScheduler, scheduled } from 'rxjs';

import { testAppConfig } from '../../../test.config';
import { APP_CONFIG } from '../../app.config';
import { metaReducers, reducers } from '../../core/store';
import { BarplotComponent } from '../barplot/barplot.component';
import { ResearchAgeComponent } from './research-age.component';

describe('ResearchAgeComponent', () => {
  let component: ResearchAgeComponent;
  let fixture: ComponentFixture<ResearchAgeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BarplotComponent,
        ResearchAgeComponent
      ],
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
        RouterTestingModule.withRoutes([]),
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
    fixture = TestBed.createComponent(ResearchAgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
