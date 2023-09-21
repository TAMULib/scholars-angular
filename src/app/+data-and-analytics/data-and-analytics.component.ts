import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, filter, map, take, tap, withLatestFrom } from 'rxjs';

import { SolrDocument } from '../core/model/discovery';
import { DataAndAnalyticsView, DisplayView } from '../core/model/view';
import { ContainerType } from '../core/model/view/data-and-analytics-view';
import { AppState } from '../core/store';
import { selectRouterQueryParams, selectRouterState } from '../core/store/router';
import { selectAllResources, selectDisplayViewByTypes, selectResourceById } from '../core/store/sdr';
import { selectActiveThemeOrganizationId } from '../core/store/theme';
import { fadeIn } from '../shared/utilities/animation.utility';

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

  public organization: Observable<SolrDocument>;

  public themeOrganizationId: Observable<string>;

  public isDashboard: Observable<boolean>;

  public queryParams: Observable<Params>;

  public organizations: Observable<SolrDocument[]>;

  public selectedOrganizationSubject: BehaviorSubject<SolrDocument>;

  public selectedOrganization: Observable<SolrDocument>;

  public labelSubject: BehaviorSubject<string>;

  public get colleges(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: SolrDocument) => this.filterSubOrganization(org, ['College']))
    );
  };

  public get departments(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: SolrDocument) => this.filterSubOrganization(org, ['AcademicDepartment']))
    );
  };

  public get others(): Observable<any[]> {
    return this.selectedOrganization.pipe(
      map((org: SolrDocument) => this.filterSubOrganization(org, ['!College', '!Department']))
    );
  };

  public get label(): Observable<string> {
    return this.labelSubject.asObservable();
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(private store: Store<AppState>) {
    this.selectedOrganizationSubject = new BehaviorSubject<SolrDocument>(undefined);
    this.selectedOrganization = this.selectedOrganizationSubject.asObservable()
      .pipe(filter((org: SolrDocument) => !!org));
    this.labelSubject = new BehaviorSubject<string>('');
  }

  ngOnInit(): void {
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());
    this.store.dispatch(new fromLayout.CloseSidebarAction());
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));

    this.queryParams = this.store.pipe(select(selectRouterQueryParams));

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
      tap((organizations: SolrDocument[]) => {
        this.selectedOrganizationSubject.next(organizations[organizations.length - 1]);
      })
    );

    this.themeOrganizationId = this.store.select(selectActiveThemeOrganizationId);

    this.themeOrganizationId
      .pipe(
        filter(id => !!id),
        take(1)
      ).subscribe(id => {
        this.store.pipe(
          select(selectResourceById('individual', id)),
          filter((document: SolrDocument) => !!document)
        ).pipe(take(1))
          .subscribe((document) => {

            this.displayView = this.store.pipe(
              select(selectDisplayViewByTypes(document.type)),
              filter((displayView: DisplayView) => !!displayView)
            );

            this.store.dispatch(
              new fromSdr.FindByTypesInResourceAction('displayViews', {
                types: document.type,
              })
            );
          });

        this.organization = this.store.select(selectResourceById('individual', id));

        this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));
      });
  }

  public trackByIndex(index, item): any {
    return index;
  }

  public onNavigateOrganization(organizations: SolrDocument[], index: number): void {
    let org;
    while (!!(org = organizations[++index])) {
      const id = org.id;
      this.store.dispatch(new fromSdr.ClearResourceByIdAction('individual', { id }));
    }
  }

  public onSelectOrganization(id: any): void {
    this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));
  }

  public getQueryParams(params: Params, displayView: DisplayView, view: DataAndAnalyticsView): Params {
    const queryParams: Params = { ...params };

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
    const subOrganizations = !!organization.hasSubOrganizations ? organization.hasSubOrganizations : [];

    return subOrganizations.filter(so => {
      for (const type of types) {
        const match = type.startsWith('!') ? so.type !== type : so.type === type;
        if (!match) {
          return false;
        }
      }

      return true;
    });
  }

}
