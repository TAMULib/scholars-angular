import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, filter, map, tap } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { Filterable } from '../../core/model/request';
import { OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesResearchAge } from '../../core/store/sdr';
import { ResearchAge } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { BarplotInput } from '../barplot/barplot.component';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

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

  public maxOverride: Subject<number>;

  public mean: Subject<number>;

  public median: Subject<number>;

  public researchAge: Observable<BarplotInput>;

  public averagePubRateResearchAge: Observable<BarplotInput>;

  public document: Observable<SolrDocument>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    this.maxOverride = new BehaviorSubject<number>(undefined);
    this.mean = new Subject<number>();
    this.median = new Subject<number>();
  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (this.route.parent && this.route.parent.data) {
      this.document = this.route.parent.data.pipe(map(data => data.document));

      this.route.parent.data.subscribe(data => {
        const document = data.document;

        const additionalFilters = [];

        if (document.id === 'n5d3837d6') {
          this.maxOverride.next(3000);
        }

        if (document.id !== 'n5d3837d6' && !!document.name) {
          additionalFilters.push({
            field: 'positionOrganization',
            value: document.name,
            opKey: OpKey.EQUALS
          });
        }

        const rk = 'Researchers';
        const pk = 'Publications';
        const apk = 'Average publications';

        this.researchAge = this.store.pipe(
          select(selectResourcesResearchAge('individual')),
          filter((ra: ResearchAge) => ra !== undefined && (ra.label === rk || ra.label === pk)),
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
          filter((ra: ResearchAge) => ra !== undefined && (ra.label === rk || ra.label === apk)),
          map(researchAgeToBarplotInput)
        );

        this.store.dispatch(
          this.build(rk, false, false, additionalFilters, [
            this.build(pk, true, false, additionalFilters, [
              this.build(apk, true, true, additionalFilters)
            ])
          ]));

      });
    }
  }

  private build = (
    label: string,
    accumulateMultivaluedDate: boolean = false,
    averageOverInterval: boolean = false,
    additionalFilters: Filterable[] = [],
    queue: fromSdr.GetResearchAgeAction[] = []
  ): fromSdr.GetResearchAgeAction => new fromSdr.GetResearchAgeAction('individual', {
    label,
    query: {
      expression: 'publicationDates:*'
    },
    filters: [
      ...additionalFilters,
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
    groupingIntervalInYears: this.groupingIntervalInYears,
    queue,
  });

}
