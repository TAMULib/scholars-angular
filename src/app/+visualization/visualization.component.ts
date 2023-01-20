import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, filter, Observable, Subscription, switchMap, take } from 'rxjs';
import { SolrDocument } from '../core/model/discovery';
import { DiscoveryView } from '../core/model/view';
import { AppState } from '../core/store';

import { fadeIn } from '../shared/utilities/animation.utility';

import { selectDiscoveryViewByClass, selectResourceById } from '../core/store/sdr';

import * as fromSdr from '../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-visualization',
  templateUrl: 'visualization.component.html',
  styleUrls: ['visualization.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizationComponent implements OnDestroy, OnInit {

  public discoveryView: Observable<DiscoveryView>;

  public document: Observable<SolrDocument>;

  public ready: Observable<boolean>;

  private readySubject: BehaviorSubject<boolean>;

  private subscriptions: Subscription[];

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) {
    this.subscriptions = [];
    this.readySubject = new BehaviorSubject<boolean>(false);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit() {
    this.ready = this.readySubject.asObservable();

    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        if (params.id) {
          this.readySubject.next(false);

          this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id: params.id }));

          // listen to document changes
          this.document = this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((document: SolrDocument) => document !== undefined)
          );

          // on first defined document, get discovery view
          this.discoveryView = this.store.pipe(
            select(selectResourceById('individual', params.id)),
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
      })
    );
  }

}
