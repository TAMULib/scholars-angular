import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, switchMap, take } from 'rxjs';

import { SolrDocument } from '../core/model/discovery';
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

  public document: Observable<SolrDocument>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnInit() {
    this.document = this.route.data.pipe(map(data => data.document));

    this.route.data.subscribe(data => {
      if (data.document && data.document.id) {
        // on first defined document, get discovery view
        this.discoveryView = this.store.pipe(
          select(selectResourceById('individual', data.document.id)),
          filter((document: SolrDocument) => document !== undefined),
          take(1),
          switchMap((document: SolrDocument) => {
            return this.store.pipe(
              select(selectDiscoveryViewByClass(document.class)),
              filter((view: DiscoveryView) => view !== undefined)
            );
          })
        );
      }
    });
  }

}
