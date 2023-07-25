import { isPlatformServer } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, filter, first, map, tap } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../../../app/app.config';
import { SolrDocument } from '../../core/model/discovery';
import { Filterable } from '../../core/model/request';
import { OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourceById, selectResourcesResearchAge } from '../../core/store/sdr';
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private store: Store<AppState>
  ) {
    this.maxOverride = new BehaviorSubject<number>(undefined);
    this.mean = new Subject<number>();
    this.median = new Subject<number>();
  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.document = this.store.pipe(
      select(selectResourceById('individual', this.appConfig.organizationId)),
      filter((document: SolrDocument) => document !== undefined)
    );

    this.document.pipe(first()).subscribe(document => {
      this.render(document);
    });

    this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id: this.appConfig.organizationId }));
  }

  private render(document: SolrDocument): void {
        const additionalFilters = [];

        if (document.id === this.appConfig.organizationId) {
          this.maxOverride.next(3000);
        }

        // not all documents have a name
        if (document.id !== this.appConfig.organizationId && !!document.name) {
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
