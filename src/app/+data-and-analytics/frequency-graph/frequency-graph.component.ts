import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { select, Store } from '@ngrx/store';

import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, Subscription, take, tap } from 'rxjs';
import { SdrCollection, SdrFacet } from 'src/app/core/model/sdr';
import { Individual } from '../../core/model/discovery';
import { IndividualRepo } from '../../core/model/discovery/repo/individual.repo';
import { Facetable } from '../../core/model/request';
import { DataAndAnalyticsView, DisplayView, Filter, OpKey } from '../../core/model/view';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { selectRouterState } from '../../core/store/router';
import { CustomRouterState } from '../../core/store/router/router.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { createSdrRequest } from '../../shared/utilities/discovery.utility';
import { TranslateService } from '@ngx-translate/core';

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
}

@Component({
  selector: 'scholars-frequency-graph',
  templateUrl: './frequency-graph.component.html',
  styleUrls: ['./frequency-graph.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrequencyGraphComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public organization: Individual;

  @Input()
  public displayView: DisplayView;

  @Input()
  public dataAndAnalyticsView: DataAndAnalyticsView;

  @Input()
  public filters: any[];

  @Input()
  public themeOrganization: string;

  @Output()
  public labelEvent: EventEmitter<string>;

  @Output()
  public selectedFilters: Observable<FrequencyGraphFilter[]>;

  public routerState: Observable<CustomRouterState>;

  public facets: Observable<SdrFacet[]>;

  public selectedFacet: Observable<SdrFacet>;

  public selectedFiltersSubject: BehaviorSubject<FrequencyGraphFilter[]>;

  public selectedFacetSubject: BehaviorSubject<SdrFacet>;

  public form: UntypedFormGroup;

  public availableColors = [...colorConstantQueue].reverse();

  private filterSubscription: Subscription;

  constructor(
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly formBuilder: UntypedFormBuilder,
    readonly translate: TranslateService,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
    readonly individualRepo: IndividualRepo
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.selectedFiltersSubject = new BehaviorSubject<FrequencyGraphFilter[]>([]);
    this.selectedFilters = this.selectedFiltersSubject.asObservable();
    this.selectedFacetSubject = new BehaviorSubject<SdrFacet>(undefined);
    this.selectedFacet = this.selectedFacetSubject.asObservable()
      .pipe(filter(facet => !!facet));
  }

  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    const formGroup = {
      filter: new UntypedFormControl()
    };

    this.form = this.formBuilder.group(formGroup);

    this.routerState = this.store.pipe(
      select(selectRouterState),
      filter((router: any) => router !== undefined),
      map((router: any) => router.state)
    );

    this.loadFacets(this.organization);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { organization } = changes;

    if (organization?.currentValue) {
      this.loadFacets(organization.currentValue);
    }
  }

  loadFacets(organization): void {
    if (this.routerState) {
      this.selectedFacetSubject.next(undefined);
      this.selectedFiltersSubject.next([]);
      this.availableColors = [...colorConstantQueue].reverse();
      this.routerState.pipe(take(1)).subscribe((routerState: CustomRouterState) => {

        const originalSdrRequest = createSdrRequest(routerState);

        const sdrRequest = Object.assign(originalSdrRequest, {
          page: {
            number: 1,
            size: 1,
            sort: originalSdrRequest.page.sort
          },
          facets: originalSdrRequest.facets.map((f: Facetable) => {
            f.pageNumber = 1;
            f.pageSize = 2147483647;
            return f;
          }),
          highlight: {},
          query: Object.assign(originalSdrRequest.query, {
            fields: 'class'
          })
        });

        sdrRequest.filters.push({
          field: 'authorOrganization',
          opKey: OpKey.EQUALS,
          value: organization.name
        });

        this.facets = this.individualRepo.search(sdrRequest)
          .pipe(
            tap((collection: SdrCollection) => {
              if (collection?.facets.length > 0) {
                this.onSelectFacet(collection.facets[0]);
                for (let facet of collection.facets) {
                  for (const exclude of [this.organization.name, this.themeOrganization]) {
                    const index = facet.entries.content.findIndex(entry => entry.value === exclude);
                    facet.entries.content.splice(index, 1);
                  }
                }
              }
            }),
            map((collection: SdrCollection) => collection.facets.concat([
              this.buildViewAllFacet(collection.facets)
            ]))
          );
      });
    }
  }

  onSelectFacet(facet): void {
    this.form.controls.filter.setValue('');

    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }

    if (!facet.page) {
      facet.page = 1;
    }
    if (!facet.pageSize) {
      facet.pageSize = 10;
    }

    const content = Object.assign([], facet.entries.content);
    this.filterSubscription = this.form.controls.filter.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe((term: string) => {
      term = term.toLowerCase();
      facet.entries.content = content.filter((entry) => entry.value.toLowerCase().indexOf(term) >= 0);
    });

    this.selectedFacetSubject.next(facet);
  }

  onSelectFilter(entry): void {
    const filters = [...this.selectedFiltersSubject.value];

    if (entry.selected) {
      entry.color = this.availableColors.pop();
      // when available colors is empty the unselected input that invokes this method is disabled
      filters.push({
        field: entry.field,
        value: entry.value,
        opKey: OpKey.EQUALS,
        color: entry.color
      });
    } else {
      const index = filters.findIndex(
        f => f.field === entry.field &&
          f.value === entry.value
      );
      if (index !== -1) {
        filters.splice(index, 1);
        this.availableColors.push(entry.color);
        delete entry.color;
      }
    }

    this.selectedFiltersSubject.next(filters);
  }

  getFacetLabel(facet = { field: 'all' }): string {
    switch (facet.field) {
      case 'authorOrganization':
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.ORGANIZATIONS');
      case 'authors':
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.PEOPLE');
      default:
        return this.translate.instant('DATA_AND_ANALYTICS.FREQUENCY_GRAPH.VIEW_ALL');
    }
  }

  buildViewAllFacet(facets): SdrFacet {
    let defaultSelected = 3;
    const content = facets
      .flatMap(facet => facet.entries.content.map(entry => {
        entry.field = facet.field;
        entry.selected = defaultSelected > 0;
        if (defaultSelected > 0) {
          this.onSelectFilter(entry);
          defaultSelected--;
        }
        return entry;
      }))
      .sort((a, b) => b.count - a.count);

    const page = {
      size: 2147483647,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
    };

    return {
      field: 'all',
      entries: {
        content,
        page
      }
    };
  }

}
