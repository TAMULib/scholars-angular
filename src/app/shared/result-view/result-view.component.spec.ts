import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Layout } from '../../core/model/view';
import { SharedModule } from '../shared.module';
import { ResultViewComponent } from './result-view.component';

describe('ResultViewComponent', () => {
  let component: ResultViewComponent;
  let fixture: ComponentFixture<ResultViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultViewComponent);
    component = fixture.componentInstance;
    component.view = {
      name: 'Test',
      layout: Layout.GRID,
      templates: {
        default: '<span>Hello, World!</span>',
      },
      templateFunctions: {
        default: (resource: any) => component.view.templates.default,
      },
      styles: [],
      fields: [],
      facets: [],
      filters: [],
      boosts: [],
      sort: [],
      export: [],
      _links: {
        self: {
          href: '',
        },
      },
    };
    component.resource = {
      type: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
