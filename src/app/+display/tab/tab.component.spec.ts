import { APP_BASE_HREF } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { queueScheduler, scheduled } from 'rxjs';

import { testAppConfig } from '../../../test.config';
import { metaReducers, reducers } from '../../core/store';
import { SharedModule } from '../../shared/shared.module';
import { routes } from '../display.routes';
import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  let component: TabComponent;
  let fixture: ComponentFixture<TabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TabComponent],
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
        RouterTestingModule.withRoutes(routes[0].children),
      ],
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              params: scheduled([{ collection: 'individual', id: 'test' }], queueScheduler),
            },
            params: scheduled([{ view: 'People', tab: 'View All' }], queueScheduler),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
