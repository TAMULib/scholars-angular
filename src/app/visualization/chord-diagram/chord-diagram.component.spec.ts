import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { testAppConfig } from '../../../test.config';
import { metaReducers, reducers } from '../../core/store';
import { VisualizationModule } from '../visualization.module';
import { routes } from '../visualization.routes';
import { ChordDiagramComponent } from './chord-diagram.component';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
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
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes(routes),
        VisualizationModule,
      ],
      providers: [
        TranslateService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChordDiagramComponent);
    component = fixture.componentInstance;
    component.dataNetwork = {
      id: 'n00000001',
      lookup: new Map<string, string>(),
      linkCounts: new Map<string, number>(),
      yearCounts: new Map<string, number>(),
      data: []
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
