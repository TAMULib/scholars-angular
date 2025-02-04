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
  public defaultId: string;

  @Output()
  public labelEvent: EventEmitter<string>;

  @Output()
  public selectedFilters: Observable<Filter[]>;

  public routerState: Observable<CustomRouterState>;

  public facets: Observable<SdrFacet[]>;

  public selectedFacet: Observable<SdrFacet>;

  public selectedFiltersSubject: BehaviorSubject<Filter[]>;

  public selectedFacetSubject: BehaviorSubject<SdrFacet>;

  public form: UntypedFormGroup;

  private filterSubscription: Subscription;

  constructor(
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly formBuilder: UntypedFormBuilder,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
    readonly individualRepo: IndividualRepo
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.selectedFiltersSubject = new BehaviorSubject<Filter[]>([]);
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
                this.onSelectFacet(collection?.facets[0]);
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

    this.selectedFilters.subscribe(console.log);
  }

  onSelectFilter(entry): void {
    const filters = this.selectedFiltersSubject.value;
    const filter = {
      field: entry.field,
      value: entry.value,
      opKey: OpKey.EQUALS
    };

    if (entry.selected) {
      filters.push(filter);
    } else {
      const index = filters.findIndex(
        f => f.field === entry.field &&
          f.value === entry.value &&
          f.opKey === OpKey.EQUALS
      );
      if (index !== -1) {
        filters.splice(index, 1);
      }
    }
    this.selectedFiltersSubject.next(filters);
  }

  getFacetLabel(facet = { field: 'all' }): string {
    switch (facet.field) {
      case 'authorOrganization': return 'Organizations';
      case 'authors': return 'People';
      default: return 'View All';
    }
  }

  buildViewAllFacet(facets): SdrFacet {
    const content = facets
      .flatMap(facet => facet.entries.content.map(entry => {
        entry.field = facet.field;
        entry.selected = false;
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
