import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, concat, filter, map } from 'rxjs';

import { OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesResearchAge } from '../../core/store/sdr';
import { ResearchAge } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';
import { BarplotInput } from '../barplot/barplot.component';

@Component({
  selector: 'scholars-research-age',
  templateUrl: './research-age.component.html',
  styleUrls: ['./research-age.component.scss'],
  animations: [fadeIn],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchAgeComponent implements OnDestroy, OnInit {

  // TODO: update store to support multiple research age by name

  // or one way binding passing value when arrives to the barplot
  public researchAge: Observable<BarplotInput>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {

    this.researchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: ResearchAge) => ra !== undefined),
      map((ra: ResearchAge) => {
        return {
          data: ra.groups
        } as BarplotInput;
      })
    );

    this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
      query: {
        expression: 'publicationDates:*'
      },
      filters: [
        {
          field: 'class',
          value: 'Person',
          opKey: OpKey.EXPRESSION
        }
      ],
      dateField: 'publicationDates',
      upperLimitInYears: 40,
      groupingIntervalInYears: 5
    }));
  }

}
