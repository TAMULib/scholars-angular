import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, filter, map, take, tap, withLatestFrom } from 'rxjs';

import { Individual } from '../core/model/discovery';
import { DataAndAnalyticsView, DisplayView, Filter } from '../core/model/view';
import { ContainerType } from '../core/model/view/data-and-analytics-view';
import { AppState } from '../core/store';
import { selectRouterQueryParamFilters, selectRouterQueryParams, selectRouterState } from '../core/store/router';
import { selectAllResources, selectDisplayViewByTypes, selectResourceById } from '../core/store/sdr';
import { selectActiveThemeOrganizationId } from '../core/store/theme';
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

  public displayView: Observable<DisplayView>;

  public dataAndAnalyticsView: Observable<DataAndAnalyticsView>;

  public dataAndAnalyticsViews: Observable<DataAndAnalyticsView[]>;

  public organization: Observable<Individual>;

  public themeOrganizationId: Observable<string>;

  public isDashboard: Observable<boolean>;

  public queryParams: Observable<Params>;

  public filters: Observable<any[]>;

  public organizations: Observable<Individual[]>;

  public selectedOrganizationSubject: BehaviorSubject<Individual>;

  public labelSubject: BehaviorSubject<string>;

  public get colleges(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: Individual) => this.filterSubOrganization(org, ['College']))
    );
  };

  public get departments(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: Individual) => this.filterSubOrganization(org, ['AcademicDepartment']))
    );
  };

  public get others(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: Individual) => this.filterSubOrganization(org, ['!College', '!AcademicDepartment']))
    );
  };

  public get selectedOrganization(): Observable<Individual> {
    return this.selectedOrganizationSubject.asObservable()
      .pipe(filter((org: Individual) => !!org));
  }

  public get label(): Observable<string> {
    return this.labelSubject.asObservable();
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<AppState>
  ) {
    this.selectedOrganizationSubject = new BehaviorSubject<Individual>(undefined);
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

    this.organizations = this.store.pipe(
      select(selectAllResources('individual')),
      tap((organizations: Individual[]) => {
        this.selectedOrganizationSubject.next(organizations[organizations.length - 1]);
      })
    );

    this.themeOrganizationId = this.store.select(selectActiveThemeOrganizationId);

    this.themeOrganizationId
      .pipe(
        filter(id => !!id),
        take(1)
    ).subscribe(id => {

      this.organization = this.store.pipe(
        select(selectResourceById('individual', id)),
        filter((organization: Individual) => !!organization)
      );

      this.organization.pipe(take(1))
        .subscribe((organization) => {
          this.displayView = this.store.pipe(
            select(selectDisplayViewByTypes(organization.type)),
            filter((displayView: DisplayView) => !!displayView)
          );

          this.store.dispatch(
            new fromSdr.FindByTypesInResourceAction('displayViews', {
              types: organization.type,
            })
          );

          this.queryParams.pipe(take(1)).subscribe((params: Params) => {
            if (!!params.selectedOrganizations) {
              const ids = params.selectedOrganizations.split(',');
              const id = ids.shift();
              const queue = ids.map((id: string) => new fromSdr.GetOneResourceAction('individual', { id }));
              this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id, queue }));
            }
          });
        });

        this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));

      });
  }

  public getDataAndAnalyticsRouterLink(view: DataAndAnalyticsView): string[] {
    return ['/data-and-analytics', view.name];
  }

  public getDataAndAnalyticsQueryParamsRemovingFilter(params: Params, filterToRemove: Filter): Params {
    const queryParams: Params = Object.assign({}, params);
    removeFilterFromQueryParams(queryParams, filterToRemove);
    return queryParams;
  }

  public getDataAndAnalyticsQueryParamsClearingFilters(params: Params, view: DataAndAnalyticsView): Params {
    const queryParams: Params = Object.assign({}, params);
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

  public onNavigateOrganization(params: Params, organizations: Individual[], index: number): void {
    const selectedOrganizations: string[] = !!params.selectedOrganizations
      ? params.selectedOrganizations.split(',')
      : [];

    let org;
    while (!!(org = organizations[++index])) {
      const id = org.id;
      this.store.dispatch(new fromSdr.ClearResourceByIdAction('individual', { id }));
      let i;
      if ((i = selectedOrganizations.indexOf(id)) >= 0) {
        selectedOrganizations.splice(i, 1);
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...params, selectedOrganizations: selectedOrganizations.join(',') },
      queryParamsHandling: 'merge'
    });
  }

  public onSelectOrganization(id: any, params: Params): void {
    const selectedOrganizations = !!params.selectedOrganizations
      ? `${params.selectedOrganizations},${id}`
      : id;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...params, selectedOrganizations },
      queryParamsHandling: 'merge'
    });

    this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));
  }

  public getQueryParams(params: Params, view: DataAndAnalyticsView, displayView: DisplayView): Params {
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

    return queryParams;
  }

  public onLabelEvent(label: string): void {
    this.labelSubject.next(label);
  }

  private filterSubOrganization(organization: any, types: string[]): any[] {
    const subOrganizations = !!organization.hasSubOrganizations
      ? organization.hasSubOrganizations
      : [];

    return subOrganizations.filter(so => {
      for (const type of types) {
        const match = type.startsWith('!')
          ? so.type !== type.substring(1)
          : so.type === type;
        if (!match) {
          return false;
        }
      }

      return true;
    });
  }

}
