import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { scheduled } from 'rxjs';
import { queueScheduler } from 'rxjs';

import { VisualizationModule } from '../visualization.module';

import { ChordDiagramComponent } from './chord-diagram.component';

import { metaReducers, reducers } from '../../core/store';

import { routes } from '../visualization.routes';

import { testAppConfig } from '../../../test.config';
import { APP_CONFIG } from 'src/app/app.config';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  const params = {};

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
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
        RouterTestingModule.withRoutes(routes[0].children),
      ],
      providers: [
        { provide: APP_CONFIG, useValue: testAppConfig },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: scheduled([params], queueScheduler),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChordDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
