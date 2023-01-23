import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VisualizationModule } from '../visualization.module';
import { ChordDiagramComponent } from './chord-diagram.component';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        VisualizationModule,
      ],
      providers: [
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
