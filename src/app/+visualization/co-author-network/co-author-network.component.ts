import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { AppState } from '../../core/store';
import { selectResourceById, selectResourcesDataNetwork } from '../../core/store/sdr';
import { DataNetwork } from '../../core/store/sdr/sdr.reducer';
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

  public dataNetwork: Observable<DataNetwork>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (this.route.parent && this.route.parent.data) {
      this.route.parent.data.subscribe(data => {
        if (data.document && data.document.id) {
          const id = data.document.id;
          this.document = this.store.pipe(
            select(selectResourceById('individual', id)),
            filter((document: SolrDocument) => document !== undefined)
          );
          this.dataNetwork = this.store.pipe(
            select(selectResourcesDataNetwork('individual')),
            filter((document: DataNetwork) => document !== undefined),
          );
          this.store.dispatch(new fromSdr.GetNetworkAction('individual', {
            id,
            dateField: 'publicationDate',
            dataFields: ['authors'],
            typeFilter: 'class:Document'
          }));
        }
      });
    }
  }

  asIsOrder(): number {
    return 0;
  }

}
