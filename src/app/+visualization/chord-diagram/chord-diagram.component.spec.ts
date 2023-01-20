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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
