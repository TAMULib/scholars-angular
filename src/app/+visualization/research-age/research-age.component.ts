import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter, Observable, take } from 'rxjs';

import { AppState } from '../../core/store';
import { OpKey } from '../../core/model/view';
import { ResearchAge } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { selectResourcesResearchAge } from '../../core/store/sdr';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'app-research-age',
  templateUrl: './research-age.component.html',
  styleUrls: ['./research-age.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchAgeComponent implements OnDestroy, OnInit {

  // TODO: update store to support multiple research age by name

  // or one way binding passing value when arrives to the barplot
  public researchAge: Observable<ResearchAge>;

  public researcherAge: Observable<ResearchAge>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    this.researchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((document: ResearchAge) => document !== undefined),
    );
    this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
      query: {
        expression: 'publicationDate:*'
      },
      filters: [
        {
          field: 'class',
          value: 'Document OR type:creativeWork',
          opKey: OpKey.EXPRESSION
        }
      ],
      dateField: 'publicationDate',
      upperLimitInYears: 40,
      groupingIntervalInYears: 5
    }));
  }

}
