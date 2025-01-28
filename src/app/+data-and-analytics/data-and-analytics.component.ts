import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, filter, map, take, withLatestFrom } from 'rxjs';

import { Individual } from '../core/model/discovery';
import { IndividualRepo } from '../core/model/discovery/repo/individual.repo';
import { DataAndAnalyticsView, DisplayView, Filter, OpKey } from '../core/model/view';
import { ContainerType } from '../core/model/view/data-and-analytics-view';
import { AppState } from '../core/store';
import { selectRouterQueryParamFilters, selectRouterQueryParams, selectRouterState } from '../core/store/router';
import { selectAllResources, selectDisplayViewByTypes, selectResourceSelected } from '../core/store/sdr';
import { selectActiveThemeOrganization, selectActiveThemeOrganizationId } from '../core/store/theme';
import { fadeIn } from '../shared/utilities/animation.utility';
import { getFilterField, getFilterValue, getQueryParamsForFacets, removeFilterFromQueryParams, resetFiltersInQueryParams, showClearFilters, showFilter } from '../shared/utilities/view.utility';

import * as fromLayout from '../core/store/layout/layout.actions';
import * as fromSdr from '../core/store/sdr/sdr.actions';
import * as fromSidebar from '../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-data-and-analytics',
  templateUrl: 'data-and-analytics.component.html',
  styleUrls: ['data-and-analytics.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataAndAnalyticsComponent implements OnInit {

  @ViewChild('organizationSelect') organizationSelect: ElementRef<HTMLSelectElement>;

  public displayView: Observable<DisplayView>;

  public dataAndAnalyticsView: Observable<DataAndAnalyticsView>;

  public dataAndAnalyticsViews: Observable<DataAndAnalyticsView[]>;

  public organization: Observable<Individual>;

  public themeOrganization: Observable<string>;

  public themeOrganizationId: Observable<string>;

  public isDashboard: Observable<boolean>;

  public queryParams: Observable<Params>;

  public filters: Observable<any[]>;

  public selectedOrganization: Observable<Individual>;

  public labelSubject: BehaviorSubject<string>;

  public organizations: Observable<Individual[]>;

  public get label(): Observable<string> {
    return this.labelSubject.asObservable();
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private individualRepo: IndividualRepo,
  ) {
    this.labelSubject = new BehaviorSubject<string>('');
  }

  ngOnInit(): void {
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());
    this.store.dispatch(new fromLayout.CloseSidebarAction());

    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));

    this.queryParams = this.store.pipe(select(selectRouterQueryParams));
    this.filters = this.store.pipe(select(selectRouterQueryParamFilters));

    this.dataAndAnalyticsViews = this.store.pipe(select(selectAllResources<DataAndAnalyticsView>('dataAndAnalyticsViews')));

    this.dataAndAnalyticsView = this.store.pipe(
      select(selectRouterState),
      withLatestFrom(this.dataAndAnalyticsViews),
      map(([router, views]) => views.find((view: DataAndAnalyticsView) => !!router && view.name === router.state.params.view))
    );

    this.isDashboard = this.store.pipe(
      select(selectRouterState),
      map((router: any) => !!router && router.state.url === '/data-and-analytics')
    );

    this.selectedOrganization = this.store.pipe(
      select(selectResourceSelected('individual')),
      filter((organization: Individual) => !!organization),
    );

    // TODO: add filter select options to the data and analytic persistent view
    // Academic Department (175)
    // Administrative Unit (10) *
    // Affiliated Agency (8)
    // Association (2)
    // Branch Campus (2)
    // Center (75)
    // College (6)
    // Hospital (1)
    // Institute (27)
    // Laboratory (7)
    // Library (1)
    // Organization (1394) *
    // Program (4)
    // Publisher (4724) *
    // School (13)
    // University (11)
    // External Organization (1453) *
    // * should not be in any select options
    this.organizations = this.getOrganizationsByTypes([
      'AcademicDepartment',
      'AffiliatedAgency',
      'Association',
      'BranchCampus',
      'Center',
      'College',
      'Hospital',
      'Institute',
      'Laboratory',
      'Library',
      'Program',
      'School',
      'University',
    ]);

    this.themeOrganization = this.store.pipe(
      select(selectActiveThemeOrganization),
      filter(name => !!name),
      take(1)
    );

    this.themeOrganizationId = this.store.pipe(
      select(selectActiveThemeOrganizationId),
      filter(id => !!id),
      take(1)
    );

    combineLatest([this.queryParams.pipe(take(1)), this.themeOrganizationId])
      .pipe(take(1))
      .subscribe(([querParams, themeOrganizationId]) => {
        const id = querParams.selectedOrganization ? querParams.selectedOrganization : themeOrganizationId;

        this.store.pipe(
          select(selectResourceSelected('individual')),
          filter((organization: Individual) => !!organization),
          take(1),
        ).subscribe((organization) => {
          this.displayView = this.store.pipe(
            select(selectDisplayViewByTypes(organization.type)),
            filter((displayView: DisplayView) => !!displayView)
          );
          this.store.dispatch(
            new fromSdr.FindByTypesInResourceAction('displayViews', {
              types: organization.type,
            })
          );
        });

        this.store.dispatch(new fromSdr.SelectResourceAction('individual', { id }));
      });
  }

  public getDataAndAnalyticsRouterLink(view: DataAndAnalyticsView): string[] {
    return ['/data-and-analytics', view.name];
  }

  public getDataAndAnalyticsQueryParamsRemovingFilter(params: Params, filterToRemove: Filter): Params {
    const queryParams: Params = { ...params };
    removeFilterFromQueryParams(queryParams, filterToRemove);
    return queryParams;
  }

  public getDataAndAnalyticsQueryParamsClearingFilters(params: Params, view: DataAndAnalyticsView): Params {
    const queryParams: Params = { ...params };
    resetFiltersInQueryParams(queryParams, view);
    return queryParams;
  }

  public showFilter(view: DataAndAnalyticsView, actualFilter: Filter): boolean {
    return showFilter(view, actualFilter);
  }

  public showClearFilters(view: DataAndAnalyticsView, filters: Filter[]): boolean {
    return showClearFilters(view, filters);
  }

  public getFilterField(view: DataAndAnalyticsView, actualFilter: Filter): string {
    return getFilterField(view, actualFilter);
  }

  public getFilterValue(view: DataAndAnalyticsView, actualFilter: Filter): string {
    return getFilterValue(view, actualFilter);
  }

  public trackByIndex(index, item): any {
    return index;
  }

  public onSelectOrganization(id: any, params: Params, changedSelect?: any): void {

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...params, selectedOrganization: id },
      queryParamsHandling: 'merge'
    });

    if (this.organizationSelect && this.organizationSelect.nativeElement.id !== changedSelect?.id) {
      this.organizationSelect.nativeElement.value = '';
    }

    this.store.dispatch(new fromSdr.SelectResourceAction('individual', { id }));
  }

  public getQueryParams(params: Params, view: DataAndAnalyticsView, displayView: DisplayView, orgId?: string | number): Params {
    const queryParams: Params = {
      ...params,
      ...getQueryParamsForFacets(view),
    };

    switch (view.type) {
      case ContainerType.ACADEMIC_AGE_GROUP: break;
      case ContainerType.QUANTITY_DISTRIBUTION: break;
      case ContainerType.PROFILE_SUMMARIES_EXPORT:
        if (displayView.exportViews.length > 0) {
          queryParams.export = displayView.exportViews[0].name;
        }
        break;
      default: break;
    }

    if (orgId) {
      queryParams.selectedOrganization = orgId;
    }

    return queryParams;
  }

  public onLabelEvent(label: string): void {
    this.labelSubject.next(label);
  }

  private getOrganizationsByTypes(types: string[]): Observable<Individual[]> {
    const filters = [{
      field: 'type',
      value: `(${types.join(' OR ')})`,
      opKey: OpKey.EXPRESSION
    }, {
      field: 'class',
      value: 'Organization',
      opKey: OpKey.EQUALS
    }];

    const page = {
      number: 0,
      size: 9999,
      sort: [],
    }

    return this.individualRepo.search({ filters, page })
      .pipe(map(collection => (collection._embedded.individual as Individual[]).sort((a, b) => a.name.localeCompare(b.name))));
  }

}
