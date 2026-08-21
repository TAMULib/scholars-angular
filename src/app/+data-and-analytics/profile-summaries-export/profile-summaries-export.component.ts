import { Component, EventEmitter, Input, Inject, OnDestroy, OnInit, Output, OnChanges, SimpleChanges, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, filter, take, tap,map } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../../app.config';
import { Individual } from '../../core/model/discovery';
import { SidebarItem, SidebarItemType, SidebarMenu } from '../../core/model/sidebar';
import { DataAndAnalyticsView, DisplayView, ExportView, Filter, OpKey  } from '../../core/model/view';
import { RestService } from '../../core/service/rest.service';
import { AppState } from '../../core/store';

import { IndividualRepo } from '../../core/model/discovery/repo/individual.repo';
import { Facetable, SdrRequest } from '../../core/model/request';
import { SdrCollection, SdrFacet, SdrFacetEntry } from '../../core/model/sdr/';
import { SdrFacetPivot } from '../../core/model/sdr/sdr-facet-pivot';
import { DialogService } from '../../core/service/dialog.service';

import { selectRouterState } from '../../core/store/router';
import { CustomRouterState } from '../../core/store/router/router.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { createSdrRequest } from '../../shared/utilities/discovery.utility';

import * as fromSidebar from '../../core/store/sidebar/sidebar.actions';
import { UntypedFormBuilder } from '@angular/forms';

export interface ProfileSummaryFilter extends Filter {
  label: string;
  count?: number;
  selected?: boolean;
  series?: SdrFacetPivot[];
}

export interface SolrFacetResponse {
  facet_counts?: {
    facet_fields?: {
      publicationDate?: (string | number)[];
    };
  };
}

/**
 * Parses the raw Solr facet_fields array to extract min and max years.
 * Assumes array format: ["1983-01-01T00:00:00Z", 1, "1984-01-01T00:00:00Z", 1, ...]
 */
export function extractDateBounds(solrResponse: SolrFacetResponse): { minYear: number | null; maxYear: number | null } {
  const facetArray = solrResponse?.facet_counts?.facet_fields?.publicationDate;

  if (!facetArray || facetArray.length === 0) {
    return { minYear: null, maxYear: null };
  }

  // 1. Min Date is the first element (index 0)
  const minDateStr = facetArray[0] as string;
  const minYear = new Date(minDateStr).getUTCFullYear();

  const maxDateStr = facetArray[facetArray.length - 2] as string;
  const maxYear = new Date(maxDateStr).getUTCFullYear();

  return {
    minYear: isNaN(minYear) ? null : minYear,
    maxYear: isNaN(maxYear) ? null : maxYear
  };
}

@Component({
  selector: 'scholars-profile-summaries-export',
  templateUrl: './profile-summaries-export.component.html',
  styleUrls: ['./profile-summaries-export.component.scss']
})
export class ProfileSummariesExportComponent implements OnDestroy, OnChanges, OnInit {

  @Input() public organization: Individual;
  @Input() public displayView: DisplayView;
  @Input() public dataAndAnalyticsView: DataAndAnalyticsView;
  @Input() public defaultId: string;

  @Input() public filters: any[];
  @Input() public themeOrganization: string;

  @Output() public labelEvent: EventEmitter<string>;

  public selectedExportView: BehaviorSubject<ExportView>;
  public selectedOrganization: Observable<Individual>;
  public organizationsSubject: BehaviorSubject<Individual[]>;
  public organizations: Observable<Individual[]>;
  public facets: Observable<SdrFacet[]>;
  public routerState: Observable<CustomRouterState>;

  public isLoadingDateRange = false;
  public startYear: number | null = null;
  public endYear: number | null = null;

  public minYear: number = 1850;
  public maxYear: number = new Date().getFullYear();
  public availableYears: number[] = [];

  public readonly selectedFiltersSubject: BehaviorSubject<ProfileSummaryFilter[]>;
  public readonly selectedFilters: Observable<ProfileSummaryFilter[]>;
  public readonly selectedFacetSubject: BehaviorSubject<SdrFacet>;
  public readonly selectedFacet: Observable<SdrFacet>;
  public readonly sdrRequestSubject: BehaviorSubject<SdrRequest>;

  private subscriptions: Subscription[];
  // private subscriptions: Subscription[] = [];
  private filterSubscription: Subscription;
  private originalFilters: ProfileSummaryFilter[] = [];
  private markForChangesTimer: any;


  public selectedPeopleSubject : BehaviorSubject<any[]>;

  public get selectedPeople() : Observable<any[]> {
    return this.selectedPeopleSubject.asObservable();
  }

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly formBuilder: UntypedFormBuilder,
    readonly translate: TranslateService,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
    readonly individualRepo: IndividualRepo,
    readonly changeDetectorRef: ChangeDetectorRef,
    readonly route: ActivatedRoute,
    readonly router: Router,
    private restService: RestService,
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.selectedPeopleSubject = new BehaviorSubject<any[]>([]);
    this.organizationsSubject = new BehaviorSubject<Individual[]>([]);
    this.organizations = this.organizationsSubject.asObservable();

    this.subscriptions = [];

    this.selectedFiltersSubject = new BehaviorSubject<ProfileSummaryFilter[]>([]);
    this.selectedFilters = this.selectedFiltersSubject.asObservable();

    this.selectedFacetSubject = new BehaviorSubject<SdrFacet>(undefined);
    this.selectedFacet = this.selectedFacetSubject.asObservable().pipe(
      filter(facet => !!facet)
    );

    this.sdrRequestSubject = new BehaviorSubject<SdrRequest>(undefined);
    // this.routerState = this.store.pipe(select(selectRouterState));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
    if (this.markForChangesTimer) {
      clearTimeout(this.markForChangesTimer);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (changes['organization'] && !changes['organization'].firstChange) {
      this.clearSelections();
      this.loadFacets(this.organization);

      const orgObj = changes.organization.currentValue.name;
      console.log(orgObj);
      const orgName = typeof orgObj === 'string' ? orgObj : orgObj?.name;
      
      if (orgName) {
        this.fetchDateRangeForOrg(orgName);
      }
    }

    const startChanged = changes['startYear'] && !changes['startYear'].firstChange;
    const endChanged = changes['endYear'] && !changes['endYear'].firstChange;

    if (startChanged || endChanged) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          startYear: this.startYear ? String(this.startYear) : null,
          endYear: this.endYear ? String(this.endYear) : null
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  private fetchDateRangeForOrg(orgName: string): void {
console.log('\n orgName', orgName);
    this.isLoadingDateRange = true;

    this.individualRepo.getDateRange(orgName).subscribe({
      next: (collection: SdrCollection) => { console.log('\n collection', collection);
        const facet = collection.facets?.find(f => f.field === 'publicationDate');
        console.log('\n collection facet', facet);
        const entries = facet?.entries?.content || [];

        if (entries.length > 0) {
          // Earliest publication year (index 0)
          const earliestDate = new Date(entries[0].value);
          this.startYear = !isNaN(earliestDate.getTime()) ? earliestDate.getUTCFullYear() : null;

          // Latest publication year (last index)
          const latestDate = new Date(entries[entries.length - 1].value);
          this.endYear = !isNaN(latestDate.getTime()) ? latestDate.getUTCFullYear() : null;
        } else {
          this.startYear = null;
          this.endYear = null;
        }

        this.isLoadingDateRange = false;
      },
      error: (err) => {
        console.error('Error loading date range for organization:', err);
        this.isLoadingDateRange = false;
      }
    });
  }
  

  ngOnInit(): void {
    this.selectedExportView = new BehaviorSubject<ExportView>(undefined);
    this.populateAvailableYears();

    if (this.organization) {
      this.loadFacets(this.organization);
    }

    this.subscriptions.push(
      this.route.queryParams.subscribe((queryParams: Params) => {
        const activeExport = queryParams['export'];
        const currentStart = queryParams['startYear'] ?? this.startYear ?? this.minYear;
        const currentEnd = queryParams['endYear'] ?? this.endYear ?? this.maxYear;
        const menu: SidebarMenu = {
          sections: [
            {
              title: this.translate.instant('DATA_AND_ANALYTICS.TIME_PERIOD'),
              items: this.displayView.exportViews
              .filter((exportView: ExportView) => exportView['name'] === queryParams['export'])
              .map((exportView: ExportView) => {
                const selected = activeExport ? activeExport === exportView.name : exportView.name === 'CustomYearsPublicationRange';

                if (selected) {
                  this.selectedExportView.next(exportView);
                  this.labelEvent.next(this.translate.instant('DATA_AND_ANALYTICS.PROFILE_SUMMARIES', { timePeriod: exportView.name }));
                }
                return {
                  label: exportView.name,
                  type: SidebarItemType.FACET,
                  facet: {
                    type: 'DATE_RANGE',
                    selectedStartYear: Number(currentStart),
                    selectedEndYear: Number(currentEnd),
                    availableYears: this.availableYears,
                    onStartChange: (newStart: number) => {
                      this.router.navigate([], {
                        relativeTo: this.route,
                        queryParams: { startYear: String(newStart) },
                        queryParamsHandling: 'merge'
                      });
                    },
                    onEndChange: (newEnd: number) => {
                      this.router.navigate([], {
                        relativeTo: this.route,
                        queryParams: { endYear: String(newEnd) },
                        queryParamsHandling: 'merge'
                      });
                    }
                  },
                  route: ['./'],
                  queryParams: {
                    export: exportView.name,
                    startYear: String(currentStart),
                    endYear: String(currentEnd)
                  },
                  selected
                }
              }),
              collapsed: false,
              collapsible: false,
              expandable: false,
              useDialog: false
            }
          ]
        };

        this.store.dispatch(new fromSidebar.LoadSidebarAction({ menu }));
      })
    );

  }

  public getSelectedExportView(): Observable<ExportView> {
    return this.selectedExportView.asObservable();
  }

  public onSelectAll(event: Event, organization: any): void {
    // const currentOrgIds = (organization.people || []).map(p => p.id);
    const checked = (event.target as HTMLInputElement).checked;
    const people = organization.people || [];
    if (checked) {
      this.selectedPeopleSubject.next([...people]);
    } else {
      this.selectedPeopleSubject.next([]);
    }
    const checkboxes = document.querySelectorAll<HTMLInputElement>('.selected-profile-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
  }

  public onSelectPerson(event: Event, person: Individual): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const current = this.selectedPeopleSubject.value;
      if (!current.find(p => p.id === person.id)) {
        this.selectedPeopleSubject.next([...current, person]);
      }
    } else {
      const current = this.selectedPeopleSubject.value.filter(p => p.id !== person.id);
      this.selectedPeopleSubject.next(current);
    }
  }

  private extractFilename(response: any, defaultFileName: string): string {
    const contentDisposition = response.headers?.get('Content-Disposition');
    return contentDisposition?.match(/^.*filename=(.*)$/)[1]?.trim() || defaultFileName;
  }

  public isPersonSelected(person: any): boolean {
    const list = this.selectedPeopleSubject.value || [];
    return list.some(p => p.id === person.id);
  }

  public downloadSelectedPeople(organization: any, selected: any): void {
  this.route.queryParams.pipe(take(1)).subscribe((params) => {
    console.log(params);
    const orgId = params?.selectedOrganization ? params.selectedOrganization : organization.id;
    const selectedIds = this.selectedPeopleSubject.value.map(p => p.id);

    if (!orgId) {
      console.error('Download failure: Missing Organization id.');
      return;
    }

    const exportName = (selected?.name ? selected.name : params?.export ? params.export : '')
                      .trim().replace(/\s+/g, ' ');
    const startYearParam = params['startYear'] ? `&startYear=${params['startYear']}` : '';
    const endYearParam = params['endYear'] ? `&endYear=${params['endYear']}` : '';

    if (!selectedIds.length || selectedIds.length === (organization.people?.length ?? 0)) {
      const linkKey = params?.export?.toLowerCase().replace(/ /g, '_');
      let downloadUrl = organization._links?.[linkKey]?.href;

      if (!downloadUrl) {
        downloadUrl = `${this.appConfig.serviceUrl}/individual/${orgId}/export?type=zip&name=${encodeURIComponent(exportName)}${startYearParam}${endYearParam}`;
        console.log("\n GET", downloadUrl);
      }

      this.restService.get<Blob>(
        downloadUrl,
        { observe: 'response', responseType: 'blob' as 'json' })
        .pipe(take(1))
        .subscribe((response: any) => {
          const filename = this.extractFilename(response, 'export.zip');
          // this.download(response, filename);
        });
    } else {
      const updatedHref = `${this.appConfig.serviceUrl}/individual/${orgId}/export?type=zip&name=${encodeURIComponent(exportName)}${startYearParam}${endYearParam}`;
      console.log("\n POST", updatedHref);
      this.restService.post(
        updatedHref,
        selectedIds,
        { observe: 'response', responseType: 'blob' as 'json', headers: { 'Content-Type': 'application/json' } }
      ).subscribe({
        next: (response: any) => {
          const filename = this.extractFilename(response, 'selected_profile.zip');
          // this.download(response, filename);
        },
        error: (err) => console.error('Failed to download selected profiles.', err),
      });
    }
  });
}

/*
  public downloadSelectedPeople(organization: any, selected: any): void {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const orgId = params?.selectedOrganization ? params.selectedOrganization : organization.id;
      const selectedIds = this.selectedPeopleSubject.value.map(p => p.id);

      if (!orgId) {
        console.error('Download failure: Missing Organization id.');
        return;
      }

      if (!selectedIds.length || selectedIds.length === (organization.people?.length ?? 0)) {
        const link = params?.export.toLowerCase().replace(/ /g, '_');
        console.log('\n link: ', link);
        console.log('\n link href: ', organization._links[link].href);
        this.restService.get<Blob>(
          organization._links[link].href,
          { observe: 'response', responseType: 'blob' as 'json' })
          .pipe(take(1))
          .subscribe((response: any) => {
            const filename = this.extractFilename(response, 'export.zip');
            //this.download(response, filename);
          },);
      } else {
        const exportName = (selected?.name ? selected.name : params?.export ? params.export : '')
                          .trim().replace(/\s+/g, ' ');

            
        const updatedHref = `${this.appConfig.serviceUrl}/individual/${orgId}/export?type=zip&name=${encodeURIComponent(exportName)}`;
        console.log('\n post exportName: ', exportName);
        console.log('\n post updatedHref: ', updatedHref);
        this.restService.post(
          updatedHref,
          selectedIds,
          { observe: 'response', responseType: 'blob' as 'json', headers: { 'Content-Type': 'application/json' } }
        ).subscribe({
          next: (response: any) => {
            const filename = this.extractFilename(response, 'selected_profile.zip');
            //this.download(response, filename);
          },
          error: (err) => console.error('Failed to download selected profiles.', err),
        });
      }
    });
  }
*/

  private download(response: any, filename: any): void {
    const blob = response.body || response;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private loadFacets(organization: Individual): void {
  console.log("\n\n\n loadFacets org: ", organization);
  if (!this.routerState) {
    return;
  }

  this.originalFilters = [];
  this.selectedFacetSubject.next(undefined);
  this.selectedFiltersSubject.next([]);

  this.routerState.pipe(take(1)).subscribe((routerState: CustomRouterState) => {
    console.log("\n\n\n loadFacets routerState: ", routerState);

    const originalSdrRequest = createSdrRequest(routerState);
    console.log("\n\n\n loadFacets originalSdrRequest: ", originalSdrRequest);

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

    console.log("\n\n\n loadFacets sdr request : ", sdrRequest);
    this.sdrRequestSubject.next(sdrRequest);

    this.facets = this.individualRepo.search(sdrRequest).pipe(
      tap((collection: SdrCollection) => {
        if (collection?.facets?.length > 0) {
          // Extract publicationDate facet to compute min & max year
          const pubDateFacet = collection.facets.find(f => f.field === 'publicationDate');
          console.log("\n\n in PUB DATE FACET", pubDateFacet);
          if (pubDateFacet?.entries?.content?.length) {
            const years = pubDateFacet.entries.content
              .map(entry => {
                // Use valueKey (e.g. "2018") or parse four digit year from ISO date value
                const yearStr = (entry as any).valueKey || (entry.value ? new Date(entry.value).getFullYear() : null);                return yearStr ? parseInt(String(yearStr), 10) : NaN;
              })
              .filter(year => !isNaN(year));

            if (years.length > 0) {
              const minComputed = Math.min(...years);
              const maxComputed = Math.max(...years);

              this.minYear = minComputed;
              this.maxYear = maxComputed;

              // Fallback to computed bounds if queryParams aren't set
              const queryParams = this.route.snapshot.queryParams;
              this.startYear = queryParams['startYear'] ? Number(queryParams['startYear']) : minComputed;
              this.endYear = queryParams['endYear'] ? Number(queryParams['endYear']) : maxComputed;

              this.populateAvailableYears();
              this.changeDetectorRef.markForCheck();
            }
          }

          for (const facet of collection.facets) {
            console.log("\n\n\n loadFacets facet: ", facet);
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
  // private loadFacets(organization: Individual): void {
  //   console.log("\n\n\n loadFacets org: ", organization);
  //   if (!this.routerState) {
  //     return;
  //   }

  //   this.loadNetworkDateBounds(organization);

  //   this.originalFilters = [];
  //   this.selectedFacetSubject.next(undefined);
  //   this.selectedFiltersSubject.next([]);
  //   this.resetYearRange();

  //   this.routerState.pipe(take(1)).subscribe((routerState: CustomRouterState) => {
  //     console.log("\n\n\n loadFacets routerState: ", routerState);

  //     const originalSdrRequest = createSdrRequest(routerState);
  //     console.log("\n\n\n loadFacets originalSdrRequest: ", originalSdrRequest);
  //     const sdrRequest: SdrRequest = {
  //       ...originalSdrRequest,
  //       page: { number: 1, size: 1, sort: originalSdrRequest.page.sort },
  //       facets: originalSdrRequest.facets.map((f: Facetable) => ({
  //         ...f,
  //         pageNumber: 1,
  //         pageSize: 2147483647
  //       })),
  //       query: { ...originalSdrRequest.query, fields: 'class' },
  //       filters: [
  //         ...originalSdrRequest.filters,
  //         { field: 'authorOrganization', opKey: OpKey.EQUALS, value: organization.name }
  //       ]
  //     };
  //     console.log("\n\n\n loadFacets sdr request : ", sdrRequest);
  //     this.sdrRequestSubject.next(sdrRequest);

  //     this.facets = this.individualRepo.search(sdrRequest).pipe(
  //       tap((collection: SdrCollection) => {
  //         if (collection?.facets.length > 0) {
  //           for (const facet of collection.facets) {
  //             console.log("\n\n\n loadFacets facet: ", facet);
  //             facet.entries.content.forEach(entry => (entry.field = facet.field));
  //             if (facet.field === 'authorOrganization') {
  //               facet.entries.content = this.filterContent(facet, 'hasSubOrganizations');
  //             } else if (facet.field === 'authors' && organization.name !== this.themeOrganization) {
  //               facet.entries.content = this.filterContent(facet, 'people');
  //             }
  //           }
  //         }
  //       }),
  //       map((collection: SdrCollection) => {
  //         const facets = collection.facets.filter(facet => facet.entries.content.length);
  //         if (facets.length > 0) {
  //           this.onSelectFacet(facets[0]);
  //           let defaultSelected = 3;
  //           for (const entry of facets[0].entries.content) {
  //             entry.selected = defaultSelected > 0;
  //             if (defaultSelected > 0) {
  //               this.onSelectFilter(entry);
  //               defaultSelected--;
  //             } else {
  //               break;
  //             }
  //           }
  //         }
  //         return facets.length > 1
  //           ? collection.facets.concat([this.buildViewAllFacet(collection.facets)])
  //           : facets;
  //       })
  //     );
  //   });
  // }

  private loadNetworkDateBounds(organization: any): void {
  const networkHref = organization?._links?.['network']?.href;
  if (!networkHref) {
    return;
  }

  this.restService.get<any>(networkHref)
    .pipe(take(1))
    .subscribe({
      next: (networkData: any) => {
        // Extract start and end year bounds returned by the network endpoint
        const fetchedStart = networkData?.startYear ?? networkData?.minYear ?? networkData?.dateRange?.start;
        const fetchedEnd = networkData?.endYear ?? networkData?.maxYear ?? networkData?.dateRange?.end;

        if (fetchedStart) {
          this.startYear = Number(fetchedStart);
        }
        if (fetchedEnd) {
          this.endYear = Number(fetchedEnd);
        }

        // Update routing query parameters if they aren't already explicitly set in the URL
        const currentQueryParams = this.route.snapshot.queryParams;
        if (!currentQueryParams['startYear'] || !currentQueryParams['endYear']) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              startYear: String(this.startYear),
              endYear: String(this.endYear)
            },
            queryParamsHandling: 'merge'
          });
        }

        this.populateAvailableYears();
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => console.error('Failed to load HATEOAS network bounds:', err)
    });
}

  public onSelectFacet(facet: SdrFacet): void {
    this.selectedFacetSubject.next(facet);
  }

  public onSelectFilter(entry: SdrFacetEntry): void {
    const currentFilters = this.selectedFiltersSubject.getValue();
    const filterEntry = entry as unknown as ProfileSummaryFilter;
    this.selectedFiltersSubject.next([...currentFilters, filterEntry]);
  }

  private filterContent(facet: SdrFacet, property: string): SdrFacetEntry[] {
    if (this.organization && (this.organization as any).hasOwnProperty(property)) {
      return facet.entries.content.filter(entry => {
        return (this.organization as any)[property].some((org: any) => org.label === entry.value);
      });
    }
    return [];
  }

  private buildViewAllFacet(facets: SdrFacet[]): SdrFacet {
    return {
      field: 'viewAll',
      entries: {
        content: [],
        page: { totalElements: 0, totalPages: 0, number: 0, size: 0 }
      }
    } as unknown as SdrFacet;
  }

  private populateAvailableYears(): void {
    this.availableYears = [];
    for (let year = this.minYear; year <= this.maxYear; year++) {
      this.availableYears.push(year);
    }
  }

  private resetYearRange(): void {
    this.endYear = new Date().getFullYear();
    this.startYear = this.endYear - 10;
    this.populateAvailableYears();
  }

   private clearSelections(): void {
    this.selectedPeopleSubject.next([]);
    this.selectedFiltersSubject.next([]);
    this.selectedFacetSubject.next(undefined);
  }


  /*

  private buildSidebarItems(solrFacets: SdrFacet[], queryParams: Params): SidebarItem[] {
    const sidebarItems: SidebarItem[] = [];
  
    // 1. Add standard Solr string/category facets
    for (const facet of solrFacets) {
      sidebarItems.push({
        label: facet.field,
        type: SidebarItemType.FACET,
        parenthetical: facet.entries?.page?.totalElements ?? facet.entries?.content?.length,
        facet: {
          type: 'DATE_RANGE',
          entries: facet.entries.content
        }
      });
    }

  // 2. Add dynamic DATE_RANGE facet powered by URL queryParams
  const startYear = queryParams['startYear'] ? Number(queryParams['startYear']) : this.minYear;
  const endYear = queryParams['endYear'] ? Number(queryParams['endYear']) : this.maxYear;

  sidebarItems.push({
    label: 'Publication Date Range',
    type: SidebarItemType.FACET,
    facet: {
      type: 'STRING',
      selectedStartYear: startYear,
      selectedEndYear: endYear,
      availableYears: this.availableYears, // Dynamic year array generated on component init
      onStartChange: (newStart: number) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { startYear: String(newStart) },
          queryParamsHandling: 'merge'
        });
      },
      onEndChange: (newEnd: number) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { endYear: String(newEnd) },
          queryParamsHandling: 'merge'
        });
      }
    }
  });

  return sidebarItems;
}
*/

public buildSidebarItems(solrFacets: SdrFacet[], queryParams: Params): SidebarItem[] {
  const sidebarItems: SidebarItem[] = [];

  if (solrFacets) {
    for (const facet of solrFacets) {
      sidebarItems.push({
        label: facet.field,
        type: SidebarItemType.FACET,
        parenthetical: facet.entries?.page?.totalElements ?? facet.entries?.content?.length,
        facet: {
          type: 'STRING',
          entries: facet.entries?.content
        }
      });
    }
  }

  const startYear = queryParams['startYear'] ? Number(queryParams['startYear']) : (this.startYear ?? this.minYear);
  const endYear = queryParams['endYear'] ? Number(queryParams['endYear']) : (this.endYear ?? this.maxYear);

  sidebarItems.push({
      label: 'Publication Date Range',
      type: SidebarItemType.FACET,
      facet: {
        type: 'DATE_RANGE',
        selectedStartYear: startYear,
        selectedEndYear: endYear,
        availableYears: this.availableYears,
        onStartChange: (newStart: number) => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { startYear: String(newStart) },
            queryParamsHandling: 'merge'
          });
        },
        onEndChange: (newEnd: number) => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { endYear: String(newEnd) },
            queryParamsHandling: 'merge'
          });
        }
      }
    });

    return sidebarItems;
}

  private createDateRangeSidebarItem(label: string, currentQueryParams: Params): SidebarItem {
  const selectedStartYear = currentQueryParams['rangeStart'] 
    ? Number(currentQueryParams['rangeStart']) 
    : this.minYear;

  const selectedEndYear = currentQueryParams['rangeEnd'] 
    ? Number(currentQueryParams['rangeEnd']) 
    : this.maxYear;

  return {
    label,
    type: SidebarItemType.FACET,
    facet: {
      type: 'DATE_RANGE',
      selectedStartYear,
      selectedEndYear,
      availableYears: this.availableYears, // Dynamic array (e.g. 1899 to 2026)
      onStartChange: (newStart: number) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rangeStart: String(newStart) },
          queryParamsHandling: 'merge'
        });
      },
      onEndChange: (newEnd: number) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rangeEnd: String(newEnd) },
          queryParamsHandling: 'merge'
        });
      }
    }
  };
}

}
