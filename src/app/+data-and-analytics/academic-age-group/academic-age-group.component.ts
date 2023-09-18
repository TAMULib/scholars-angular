import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, filter, map, tap } from 'rxjs';

import { SolrDocument } from '../../core/model/discovery';
import { Filterable } from '../../core/model/request';
import { DataAndAnalyticsView, DisplayView, OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesResearchAge } from '../../core/store/sdr';
import { AcademicAge } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { BarplotComponent, BarplotInput } from '../barplot/barplot.component';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

const academicAgeGroupToBarplotInput = (academicAge: AcademicAge): BarplotInput => {
  return {
    label: academicAge.label,
    data: academicAge.groups
  } as BarplotInput;
}

const rk = 'Researchers';
const pk = 'Publications';
const apk = 'Average publications';

@Component({
  selector: 'scholars-academic-age-group',
  templateUrl: './academic-age-group.component.html',
  styleUrls: ['./academic-age-group.component.scss'],
  animations: [fadeIn],
})
export class AcademicAgeGroupComponent implements OnInit, OnChanges {

  @Input()
  public organization: SolrDocument;

  @Input()
  public displayView: DisplayView;

  @Input()
  public dataAndAnalyticsView: DataAndAnalyticsView;

  @Output()
  public labelEvent: EventEmitter<string>;

  @Input()
  public upperLimitInYears = 40;

  @Input()
  public groupingIntervalInYears = 5;

  @ViewChildren(BarplotComponent) barplots: QueryList<BarplotComponent>;

  public maxOverride: Subject<number>;

  public mean: Subject<number>;

  public median: Subject<number>;

  public academicAge: Observable<BarplotInput>;

  public averagePubRateResearchAge: Observable<BarplotInput>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    this.labelEvent = new EventEmitter<string>();
    this.maxOverride = new BehaviorSubject<number>(undefined);
    this.mean = new Subject<number>();
    this.median = new Subject<number>();
  }

  ngOnInit() {
    this.academicAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: AcademicAge) => ra !== undefined && (ra.label === rk || ra.label === pk)),
      tap((ra: AcademicAge) => {
        if (ra.label === rk) {
          this.mean.next(ra.mean);
          this.median.next(ra.median);
        }
      }),
      map(academicAgeGroupToBarplotInput)
    );

    this.averagePubRateResearchAge = this.store.pipe(
      select(selectResourcesResearchAge('individual')),
      filter((ra: AcademicAge) => ra !== undefined && (ra.label === rk || ra.label === apk)),
      map(academicAgeGroupToBarplotInput)
    );
  }

  ngOnChanges() {
    this.store.dispatch(new fromSdr.ClearResearchAgeAction('individual'));
    setTimeout(() => {

      this.barplots.forEach(barplot => barplot.draw());

      const additionalFilters = [];

      if (this.organization.id === 'n5d3837d6') {
        this.maxOverride.next(3000);
      }

      if (this.organization.id !== 'n5d3837d6' && !!this.organization.name) {
        additionalFilters.push({
          field: 'positionOrganization',
          value: this.organization.name,
          opKey: OpKey.EQUALS
        });
      }

      this.store.dispatch(
        this.build(rk, false, false, additionalFilters, [
          this.build(pk, true, false, additionalFilters, [
            this.build(apk, true, true, additionalFilters)
          ])
        ])
      );

    });
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
