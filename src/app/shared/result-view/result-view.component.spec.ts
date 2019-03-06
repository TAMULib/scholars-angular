import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../shared.module';

import { ResultViewComponent } from './result-view.component';
import { Layout } from '../../core/model/view';

describe('ResultViewComponent', () => {
    let component: ResultViewComponent;
    let fixture: ComponentFixture<ResultViewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                SharedModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResultViewComponent);
        component = fixture.componentInstance;
        component.view = {
            name: 'Test',
            collection: 'tests',
            layout: Layout.GRID,
            template: '<span>Hello, World!</span>',
            styles: [],
            facets: [],
            filters: [],
            _links: {
                self: {
                    href: ''
                }
            }
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
