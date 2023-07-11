import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter, tap } from 'rxjs';

import { OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesQuantityDistribution } from '../../core/store/sdr';
import { QuantityDistribution } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-quantity-distribution',
  templateUrl: './quantity-distribution.component.html',
  styleUrls: ['./quantity-distribution.component.scss'],
  animations: [fadeIn],
})
export class QuantityDistributionComponent implements OnDestroy, OnInit {

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {

  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    console.log('here');
    const t = this.store.pipe(
      select(selectResourcesQuantityDistribution('individual')),
      filter((qd: QuantityDistribution) => qd !== undefined),
      tap((qd: QuantityDistribution) => {
        console.log(qd);
      }),
      // map(researchAgeToBarplotInput)
    );

    t.subscribe((qd) => console.log('done', qd));

    this.store.dispatch(new fromSdr.GetQuantityDistributionAction('individual', {
      label: 'UN SDG',
      query: {
        expression: '*:*'
      },
      filters: [
        {
          field: 'class',
          value: 'Document OR type:creativeWork',
          opKey: OpKey.EXPRESSION
        }
      ],
      field: 'tags',
      queue: []
    }));

    if (this.route.parent && this.route.parent.data) {

    }
  }

}
