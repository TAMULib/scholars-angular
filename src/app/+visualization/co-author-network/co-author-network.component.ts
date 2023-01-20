import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { filter, Observable, take } from 'rxjs';

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

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    this.route.parent.params.pipe(take(1)).subscribe((params: Params) => {
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
    });
  }

  asIsOrder(): number {
    return 0;
  }

}
