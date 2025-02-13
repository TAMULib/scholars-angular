import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  take,
  tap
} from 'rxjs';
import { Options } from '@angular-slider/ngx-slider';

import { Individual } from '../../core/model/discovery';
import { IndividualRepo } from '../../core/model/discovery/repo/individual.repo';
import { Facetable, SdrRequest } from '../../core/model/request';
import { SdrCollection, SdrFacet, SdrFacetEntry } from '../../core/model/sdr';
import { SdrFacetPivot } from '../../core/model/sdr/sdr-facet-pivot';
import { DataAndAnalyticsView, DisplayView, Filter, OpKey } from '../../core/model/view';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { selectRouterState } from '../../core/store/router';
import { CustomRouterState } from '../../core/store/router/router.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { createSdrRequest } from '../../shared/utilities/discovery.utility';

const TURQUOISE = "#8DD3C7";
const DARK_TURQUOISE = "#009999";
const LIGHT_YELLOW = "#FFFFB3";
const LIGHT_VIOLET = "#BEBADA";
const RED = "#CC0000";
const LIGHT_RED = "#FB8072";
const DARK_RED = "#520000";
const SKY_BLUE = "#80B1D3";
const DARK_BLUE = "#80B1D3";
const NAVY_BLUE = "#003366";
const LIGHT_BLUE = "#3399FF";
const ORANGE = "#FDB462";
const DARK_ORANGE = "#FF9900";
const LIGHT_GREEN = "#B3DE69";
const DARK_GREEN = "#006600";
const VIBRANT_GREEN = "#99CC00";
const LIGHT_PINK = "#FCCDE5";
const LIGHT_GREY = "#D9D9D9";
const PURPLE = "#BC80BD";
const DARK_PURPLE = "#6600CC";
const PINK_PURPLE = "#CC00CC";
const HOT_PINK = "#FF00B4";
const MEHENDI_GREEN = "#7A7900";

const colorConstantQueue = [
  LIGHT_BLUE, DARK_ORANGE, VIBRANT_GREEN,
  NAVY_BLUE, RED, PINK_PURPLE,
  DARK_TURQUOISE, MEHENDI_GREEN, HOT_PINK,
  DARK_RED
];

export interface FrequencyGraphFilter extends Filter {
  color: string;
  series: SdrFacetPivot[];
}

@Component({
  selector: 'scholars-frequency-graph',
  templateUrl: './frequency-graph.component.html',
  styleUrls: ['./frequency-graph.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrequencyGraphComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public organization: Individual;
  @Input() public displayView: DisplayView;
  @Input() public dataAndAnalyticsView: DataAndAnalyticsView;
  @Input() public filters: any[];
  @Input() public themeOrganization: string;

  @Output() public labelEvent: EventEmitter<string>;
  @Output() public selectedFilters: Observable<FrequencyGraphFilter[]>;

  public selectedFiltersSubject: BehaviorSubject<FrequencyGraphFilter[]>;
  public routerState: Observable<CustomRouterState>;
  public facets: Observable<SdrFacet[]>;
  public selectedFacet: Observable<SdrFacet>;
  public selectedFacetSubject: BehaviorSubject<SdrFacet>;
  public form: UntypedFormGroup;

  public yearEnd: number = new Date().getFullYear();
  public yearStart: number = this.yearEnd - 10;
  public yearRangeOptions: Options = {
    floor: this.yearStart,
    ceil: this.yearEnd,
    step: 1,
    showTicks: true,
    noSwitching: true
  };

  public availableColors = [...colorConstantQueue].reverse();

  readonly sdrRequestSubject: BehaviorSubject<SdrRequest>;
  private filterSubscription: Subscription;
  private originalFilters: FrequencyGraphFilter[];
  private markForChangesTimer: any;

  constructor(
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly formBuilder: UntypedFormBuilder,
    readonly translate: TranslateService,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
    readonly individualRepo: IndividualRepo,
    readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.selectedFiltersSubject = new BehaviorSubject<FrequencyGraphFilter[]>([]);
    this.selectedFilters = this.selectedFiltersSubject.asObservable();
    this.selectedFacetSubject = new BehaviorSubject<SdrFacet>(undefined);
    this.selectedFacet = this.selectedFacetSubject.asObservable().pipe(filter(facet => !!facet));
    this.sdrRequestSubject = new BehaviorSubject<SdrRequest>(undefined);
    this.originalFilters = [];
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.form = this.formBuilder.group({
      filter: new UntypedFormControl()
    });

    this.routerState = this.store.pipe(
      select(selectRouterState),
      filter((router: any) => router !== undefined),
      map((router: any) => router.state)
    );

    this.loadFacets(this.organization);
    this.selectedFilters.subscribe(console.log);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.organization?.currentValue) {
      this.loadFacets(changes.organization.currentValue);
    }
  }

  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  public onSelectFacet(facet): void {
    this.form.controls.filter.setValue('');
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }

    facet.page = facet.page || 1;
    facet.pageSize = facet.pageSize || 10;

    const originalContent = [...facet.entries.content];
    this.filterSubscription = this.form.controls.filter.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((term: string) => {
        term = term.toLowerCase();
        facet.entries.content = originalContent.filter(entry =>
          entry.value.toLowerCase().includes(term)
        );
      });

    this.selectedFacetSubject.next(facet);
  }

  public onSelectFilter(entry: any): void {
    if (entry.selected) {
      entry.color = this.availableColors.pop();
      const newFilter: FrequencyGraphFilter = {
        field: entry.field,
        value: entry.value,
        opKey: OpKey.EQUALS,
        color: entry.color,
        series: []
      };

      this.sdrRequestSubject.pipe(
        take(1),
        switchMap(originalSdrRequest => {
          const sdrRequest: SdrRequest = {
            ...originalSdrRequest,
            page: { number: 1, size: 1, sort: originalSdrRequest.page.sort },
            facets: [{
              field: 'publicationDate',
              pageNumber: 1,
              pageSize: 2147483647
            }],
            query: { ...originalSdrRequest.query, fields: 'class' },
            filters: this.mergeFiltersWithSameField([
              ...originalSdrRequest.filters,
              { field: entry.field, opKey: OpKey.EQUALS, value: entry.value }
            ])
          };

          return this.individualRepo.search(sdrRequest).pipe(
            map((collection: SdrCollection) => {
              newFilter.series =
                collection.facets[0]?.entries?.content.map(pubEntry => ({
                  field: 'publicationDate',
                  value: pubEntry.value,
                  count: pubEntry.count
                })) || [];
              return newFilter;
            }),
            catchError(error => {
              console.error('Failed to fetch series', error);
              return of(newFilter);
            })
          );
        })
      ).subscribe(filterWithSeries => {
        this.originalFilters.push(filterWithSeries);
        this.selectedFiltersSubject.next(this.filterFiltersByYearRange(this.originalFilters));
        this.updateYearRangeFromFilters();
      });
    } else {
      const origIndex = this.originalFilters.findIndex(
        f => f.field === entry.field && f.value === entry.value
      );
      if (origIndex !== -1) {
        this.originalFilters.splice(origIndex, 1);
      }
      const filters = [...this.selectedFiltersSubject.value];
      const index = filters.findIndex(
        f => f.field === entry.field && f.value === entry.value
      );
      if (index !== -1) {
        filters.splice(index, 1);
        this.availableColors.push(entry.color);
        delete entry.color;
      }
      this.selectedFiltersSubject.next(filters);
      this.updateYearRangeFromFilters();
    }
  }

  public onYearRangeChangeEnd(): void {
    this.selectedFiltersSubject.next(this.filterFiltersByYearRange(this.originalFilters));
  }

  public onClear(facets: SdrFacet[]): void {
    this.onClearSearchFilter();
    facets.forEach(facet =>
      facet.entries.content
        .filter(entry => entry.selected)
        .reverse()
        .forEach(entry => {
          entry.selected = false;
          this.onSelectFilter(entry);
        })
    );
  }

  public onClearSearchFilter(): void {
    this.form.controls.filter.setValue('');
  }

  public onSaveAll(facets: SdrFacet[]): void {
    if (!facets?.length) {
      return;
    }

    const entries = facets[facets.length - 1].entries.content;
    const header = `${this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ENTITY_LABEL')}, ` +
      `${this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ENTITY_NAME')}, ` +
      `${this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ENTITY_TYPE')}\n`;

    const organizationLabel = this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ORGANIZATION');
    const personLabel = this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.PERSON');

    const rows = entries.map(entry => {
      const value = entry.value.includes(',') ? `"${entry.value}"` : entry.value;
      const type = entry.field === 'authorOrganization' ? organizationLabel : personLabel;
      return `${value}, ${entry.count}, ${type}`;
    }).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, this.organization.name.toLowerCase().replace(/\s+/g, '-') + '_publications.csv');
  }

  public getFacetLabel(facet = { field: 'all' }): string {
    switch (facet.field) {
      case 'authorOrganization':
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ORGANIZATIONS');
      case 'authors':
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.PEOPLE');
      default:
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.VIEW_ALL');
    }
  }

  private loadFacets(organization: Individual): void {
    if (!this.routerState) {
      return;
    }

    this.originalFilters = [];
    this.selectedFacetSubject.next(undefined);
    this.selectedFiltersSubject.next([]);
    this.availableColors = [...colorConstantQueue].reverse();
    this.resetYearRange();

    this.routerState.pipe(take(1)).subscribe((routerState: CustomRouterState) => {
      const originalSdrRequest = createSdrRequest(routerState);
      const sdrRequest: SdrRequest = {
        ...originalSdrRequest,
        page: { number: 1, size: 1, sort: originalSdrRequest.page.sort },
        facets: originalSdrRequest.facets.map((f: Facetable) => ({
          ...f,
          pageNumber: 1,
          pageSize: 2147483647
        })),
        query: { ...originalSdrRequest.query, fields: 'class' },
        filters: [
          ...originalSdrRequest.filters,
          { field: 'authorOrganization', opKey: OpKey.EQUALS, value: organization.name }
        ]
      };

      this.sdrRequestSubject.next(sdrRequest);

      this.facets = this.individualRepo.search(sdrRequest).pipe(
        tap((collection: SdrCollection) => {
          if (collection?.facets.length > 0) {
            for (const facet of collection.facets) {
              facet.entries.content.forEach(entry => (entry.field = facet.field));
              if (facet.field === 'authorOrganization') {
                facet.entries.content = this.filterContent(facet, 'hasSubOrganizations');
              } else if (facet.field === 'authors' && organization.name !== this.themeOrganization) {
                facet.entries.content = this.filterContent(facet, 'people');
              }
            }
          }
        }),
        map((collection: SdrCollection) => {
          const facets = collection.facets.filter(facet => facet.entries.content.length);
          if (facets.length > 0) {
            this.onSelectFacet(facets[0]);
            let defaultSelected = 3;
            for (const entry of facets[0].entries.content) {
              entry.selected = defaultSelected > 0;
              if (defaultSelected > 0) {
                this.onSelectFilter(entry);
                defaultSelected--;
              } else {
                break;
              }
            }
          }
          return facets.length > 1
            ? collection.facets.concat([this.buildViewAllFacet(collection.facets)])
            : facets;
        })
      );
    });
  }

  private mergeFiltersWithSameField(filters: any[]): any[] {
    return filters.reduce((acc, filter) => {
      const existingFilter = acc.find(f => f.field === filter.field);
      if (existingFilter) {
        existingFilter.value = existingFilter.value
          ? `${existingFilter.value};;${filter.value}`
          : filter.value;
      } else {
        acc.push({ ...filter });
      }
      return acc;
    }, []);
  }

  private resetYearRange(): void {
    this.yearEnd = new Date().getFullYear();
    this.yearStart = this.yearEnd - 10;
    this.yearRangeOptions = {
      floor: this.yearStart,
      ceil: this.yearEnd,
      step: 1,
      showTicks: true,
      noSwitching: true
    };
  }

  private updateYearRangeFromFilters(): void {
    if (this.originalFilters.length === 0) {
      this.resetYearRange();
      this.triggerChangeDetection();
      return;
    }

    let computedMin = Infinity;
    let computedMax = -Infinity;
    this.originalFilters.forEach(filter => {
      filter.series.forEach(item => {
        const year = this.getYearFromDate(item.value);
        computedMin = Math.min(computedMin, year);
        computedMax = Math.max(computedMax, year);
      });
    });

    const oldFloor = this.yearRangeOptions.floor;
    const oldCeil = this.yearRangeOptions.ceil;

    this.yearRangeOptions = {
      ...this.yearRangeOptions,
      floor: computedMin,
      ceil: computedMax
    };

    if ((computedMin < oldFloor && this.yearStart === oldFloor) || (computedMin > oldFloor && this.yearStart < computedMin)) {
      this.yearStart = computedMin;
    }

    if ((computedMax > oldCeil && this.yearEnd === oldCeil) || (computedMax < oldCeil && this.yearEnd > computedMax)) {
      this.yearEnd = computedMax;
    }

    this.triggerChangeDetection();
  }

  private triggerChangeDetection(): void {
    if (this.markForChangesTimer) {
      clearTimeout(this.markForChangesTimer);
    }
    this.markForChangesTimer = setTimeout(() => {
      this.changeDetectorRef.markForCheck();
    }, 50);
  }

  private filterFiltersByYearRange(filters: FrequencyGraphFilter[]): FrequencyGraphFilter[] {
    return filters.map(filter => {
      const filteredSeries = filter.series.filter(item => {
        const year = this.getYearFromDate(item.value);
        return year >= this.yearStart && year <= this.yearEnd;
      });
      return { ...filter, series: filteredSeries };
    });
  }

  private filterContent(facet: SdrFacet, property: string): SdrFacetEntry[] {
    if (this.organization.hasOwnProperty(property)) {
      return facet.entries.content.filter(entry => {
        return this.organization[property].some(org => org.label === entry.value);
      });
    }
    return [];
  }

  private buildViewAllFacet(facets: SdrFacet[]): SdrFacet {
    const content = facets.flatMap(facet => facet.entries.content).sort((a, b) => b.count - a.count);
    const page = {
      size: 2147483647,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
    };
    return {
      field: 'all',
      entries: { content, page }
    };
  }

  private getYearFromDate(date: string): number {
    return new Date(date).getFullYear();
  }

}
