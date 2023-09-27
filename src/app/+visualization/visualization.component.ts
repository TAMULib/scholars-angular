import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, switchMap, take } from 'rxjs';

import { Individual } from '../core/model/discovery';
import { DiscoveryView } from '../core/model/view';
import { AppState } from '../core/store';
import { selectDiscoveryViewByClass, selectResourceById } from '../core/store/sdr';
import { fadeIn } from '../shared/utilities/animation.utility';

@Component({
  selector: 'scholars-visualization',
  templateUrl: 'visualization.component.html',
  styleUrls: ['visualization.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizationComponent implements OnInit {

  public discoveryView: Observable<DiscoveryView>;

  public individual: Observable<Individual>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnInit() {
    this.individual = this.route.data.pipe(map(data => data.individual));

    this.route.data.subscribe(data => {
      if (data.individual && data.individual.id) {
        // on first defined individual, get discovery view
        this.discoveryView = this.store.pipe(
          select(selectResourceById('individual', data.individual.id)),
          filter((individual: Individual) => individual !== undefined),
          take(1),
          switchMap((individual: Individual) => {
            return this.store.pipe(
              select(selectDiscoveryViewByClass(individual.class)),
              filter((view: DiscoveryView) => view !== undefined)
            );
          })
        );
      }
    });
  }

}
