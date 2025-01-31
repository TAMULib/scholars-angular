import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';

import { Individual } from '../../core/model/discovery';
import { DataAndAnalyticsView, DisplayView } from '../../core/model/view';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { fadeIn } from '../../shared/utilities/animation.utility';

@Component({
  selector: 'scholars-frequency-graph',
  templateUrl: './frequency-graph.component.html',
  styleUrls: ['./frequency-graph.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrequencyGraphComponent implements OnInit {

  @Input()
  public organization: Individual;

  @Input()
  public displayView: DisplayView;

  @Input()
  public dataAndAnalyticsView: DataAndAnalyticsView;

  @Input()
  public filters: any[];

  @Input()
  public defaultId: string;

  @Output()
  public labelEvent: EventEmitter<string>;

  constructor(
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
  ) {
    this.labelEvent = new EventEmitter<string>();
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }
  }

}
