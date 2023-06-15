import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map } from 'rxjs';

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
})
export class ResearchAgeComponent implements OnDestroy, OnInit {

  public researchAge: Observable<BarplotInput>;

  public averagePubRateResearchAge: Observable<BarplotInput>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    this.researchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: ResearchAge) => {
        console.log(ra);
        return ra !== undefined
          && (
            ra.label === 'Researchers'
            || ra.label === 'Researcher Publications'
          );
      }),
      map((ra: ResearchAge) => {
        return {
          data: ra.groups
        } as BarplotInput;
      })
    );

    this.averagePubRateResearchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: ResearchAge) => {
        return ra !== undefined
          && (
            ra.label === 'Researchers'
            || ra.label === 'Researcher Publications Average'
          );
      }),
      map((ra: ResearchAge) => {
        return {
          data: ra.groups
        } as BarplotInput;
      })
    );

    this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
      label: 'Researchers',
      query: {
        expression: 'publicationDates:*'
      },
      filters: [
        {
          field: 'class',
          value: 'Person',
          opKey: OpKey.EQUALS
        }
      ],
      dateField: 'publicationDates',
      accumulateMultivaluedDate: false,
      averageOverInterval: false,
      upperLimitInYears: 40,
      groupingIntervalInYears: 5
    }));

    const subscription = this.researchAge.subscribe((data: any) => {

      setTimeout(() => {
        this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
          label: 'Researcher Publications',
          query: {
            expression: 'publicationDates:*'
          },
          filters: [
            {
              field: 'class',
              value: 'Person',
              opKey: OpKey.EQUALS
            }
          ],
          dateField: 'publicationDates',
          accumulateMultivaluedDate: true,
          averageOverInterval: false,
          upperLimitInYears: 40,
          groupingIntervalInYears: 5
        }));
      });

      setTimeout(() => {
        this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
          label: 'Researcher Publications Average',
          query: {
            expression: 'publicationDates:*'
          },
          filters: [
            {
              field: 'class',
              value: 'Person',
              opKey: OpKey.EQUALS
            }
          ],
          dateField: 'publicationDates',
          accumulateMultivaluedDate: true,
          averageOverInterval: true,
          upperLimitInYears: 40,
          groupingIntervalInYears: 5
        }));

        subscription.unsubscribe();
      }, 250);
      
    });

  }

}
