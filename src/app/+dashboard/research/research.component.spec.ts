import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ResearchComponent } from './research.component';

describe('ResearchComponent', () => {
    let component: ResearchComponent;
    let fixture: ComponentFixture<ResearchComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ResearchComponent
            ],
            imports: [
                TranslateModule.forRoot()
            ],
            schemas: [
                CUSTOM_ELEMENTS_SCHEMA
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ResearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
