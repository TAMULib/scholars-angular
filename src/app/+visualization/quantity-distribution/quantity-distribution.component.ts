import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, tap } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { Filter, OpKey } from '../../core/model/view';
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

  public document: Observable<SolrDocument>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {

  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    this.store.pipe(
      select(selectResourcesQuantityDistribution('individual')),
      filter((qd: QuantityDistribution) => qd !== undefined),
      // tap((qd: QuantityDistribution) => {
      //   console.log(qd);
      // }),
      // map(researchAgeToBarplotInput)
    ).subscribe((qd) => console.log('done', qd));

    const additionalFilters = [];

    const pending = this.route.parent && this.route.parent.data;

    if (pending) {
      this.document = this.route.parent.data.pipe(map(data => data.document));

      this.route.parent.data.subscribe(data => {
        const document = data.document;
        console.log(document);

        if (document.class === 'Organization') {
          additionalFilters.push({
            field: 'authorOrganization',
            value: document.name,
            opKey: OpKey.EQUALS
          });

          this.dispatch(additionalFilters);
        }
      });
    }

    if (!pending) {
      this.dispatch(additionalFilters);
    }
    
  }

  private dispatch(additionalFilters: Filter[]): void {
    console.log('dispatch', additionalFilters);
    this.store.dispatch(new fromSdr.GetQuantityDistributionAction('individual', {
      label: 'UN SDG',
      query: {
        expression: '*:*'
      },
      filters: [
        ...additionalFilters,
        {
          field: 'class',
          value: 'Document OR type:creativeWork',
          opKey: OpKey.EXPRESSION
        }
      ],
      field: 'tags',
      queue: []
    }));
  }

}
