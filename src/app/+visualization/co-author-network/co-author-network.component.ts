import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, Observable, Subscription } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { AppState } from '../../core/store';
import { selectResourceById, selectResourcesCoDataNetwork } from '../../core/store/sdr';
import { CoDataNetwork } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-co-author-network',
  templateUrl: './co-author-network.component.html',
  styleUrls: ['./co-author-network.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoAuthorNetworkComponent implements OnDestroy, OnInit {

  public document: Observable<SolrDocument>;

  public coDataNetwork: Observable<CoDataNetwork>;

  private subscriptions: Subscription[];

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) {
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit() {
    this.subscriptions.push(
      this.route.parent.params.subscribe((params: Params) => {
        if (params.id) {
          this.document = this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((document: SolrDocument) => document !== undefined)
          );
          this.coDataNetwork = this.store.pipe(
            select(selectResourcesCoDataNetwork('individual')),
            filter((document: CoDataNetwork) => document !== undefined),
          );
          this.store.dispatch(new fromSdr.GetCoAuthorNetworkAction('individual', { id: params.id }));
        }
      })
    );
  }

}
