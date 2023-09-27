import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter } from 'rxjs';

import { Individual } from '../../core/model/discovery';
import { AppState } from '../../core/store';
import { selectResourceById, selectResourcesDataNetwork } from '../../core/store/sdr';
import { DataNetwork } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-co-investigator-network',
  templateUrl: './co-investigator-network.component.html',
  styleUrls: ['./co-investigator-network.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoInvestigatorNetworkComponent implements OnDestroy, OnInit {

  public individual: Observable<Individual>;

  public dataNetwork: Observable<DataNetwork>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (this.route.parent && this.route.parent.data) {
      this.route.parent.data.subscribe(data => {
        if (data.individual && data.individual.id) {
          const id = data.individual.id;
          this.individual = this.store.pipe(
            select(selectResourceById('individual', id)),
            filter((individual: Individual) => individual !== undefined)
          );
          this.dataNetwork = this.store.pipe(
            select(selectResourcesDataNetwork('individual')),
            filter((individual: DataNetwork) => individual !== undefined),
          );
          this.store.dispatch(new fromSdr.GetNetworkAction('individual', {
            id,
            dateField: 'dateTimeIntervalStart',
            dataFields: ['contributors'],
            typeFilter: 'class:Relationship AND type:Grant'
          }));
        }
      });
    }
  }

  asIsOrder(): number {
    return 0;
  }

}
