import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, Subject, filter, map, tap } from 'rxjs';

import { OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesResearchAge } from '../../core/store/sdr';
import { ResearchAge } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';
import { BarplotInput } from '../barplot/barplot.component';

const researchAgeToBarplotInput = (researchAge: ResearchAge): BarplotInput => {
  return {
    label: researchAge.label,
    data: researchAge.groups
  } as BarplotInput;
}

@Component({
  selector: 'scholars-research-age',
  templateUrl: './research-age.component.html',
  styleUrls: ['./research-age.component.scss'],
  animations: [fadeIn],
})
export class ResearchAgeComponent implements OnDestroy, OnInit {

  @Input()
  public upperLimitInYears = 40;

  @Input()
  public groupingIntervalInYears = 5;

  public mean: Subject<number>;

  public median: Subject<number>;

  public researchAge: Observable<BarplotInput>;

  public averagePubRateResearchAge: Observable<BarplotInput>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    this.mean = new Subject<number>();
    this.median = new Subject<number>();
  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    const rk = 'Researchers';
    const pk = 'Publications';
    const apk = 'Average publications';
    this.researchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: ResearchAge) => ra !== undefined && ( ra.label === rk || ra.label === pk )),
      tap((ra: ResearchAge) => {
        if (ra.label === rk) {
          this.mean.next(ra.mean);
          this.median.next(ra.median);
        }
      }),
      map(researchAgeToBarplotInput)
    );

    this.averagePubRateResearchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: ResearchAge) => ra !== undefined && ( ra.label === rk || ra.label === apk )),
      map(researchAgeToBarplotInput)
    );

    this.dispatch(rk, false, false);

    const subscription = this.researchAge.subscribe((data: any) => {

      setTimeout(() => {
        this.dispatch(pk, true, false);
      }, 250);

      setTimeout(() => {
        this.dispatch(apk, true, true);

        subscription.unsubscribe();
      }, 500);

    });

  }

  private dispatch = (
    label: string,
    accumulateMultivaluedDate: boolean = false,
    averageOverInterval: boolean = false,
  ): void => {
    this.store.dispatch(new fromSdr.GetResearchAgeAction('individual', {
      label,
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
      accumulateMultivaluedDate,
      averageOverInterval,
      upperLimitInYears: this.upperLimitInYears,
      groupingIntervalInYears: this.groupingIntervalInYears
    }));
  }

}
