import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, switchMap, take, withLatestFrom } from 'rxjs';

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

  public document: Observable<SolrDocument>;

  public displayView: Observable<DisplayView>;

  public dataAndAnalyticsView: Observable<DataAndAnalyticsView>;

  public dataAndAnalyticsViews: Observable<DataAndAnalyticsView[]>;

  public organization: Observable<SolrDocument>;

  public isDashboard: Observable<boolean>;

  public description: Observable<string>;

  public label: Observable<string>;

  public value: Observable<string>;

  public colleges: Observable<any[]>;

  public departments: Observable<any[]>;

  public others: Observable<any[]>;

  public queryParams: Observable<Params>;

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(private store: Store<AppState>) {

  }

  ngOnInit() {
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());
    this.store.dispatch(new fromLayout.CloseSidebarAction());

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

    this.store.select(selectActiveThemeOrganizationId)
      .pipe(
        filter(id => id !== undefined),
        take(1)
      ).subscribe(id => {
        this.document = this.store.pipe(
          select(selectResourceById('individual', id)),
          filter((document: SolrDocument) => document !== undefined)
        );

        this.document.pipe(take(1)).subscribe((document) => {
          this.displayView = this.store.pipe(
            select(selectDisplayViewByTypes(document.type)),
            filter((displayView: DisplayView) => displayView !== undefined)
          );

          this.store.dispatch(
            new fromSdr.FindByTypesInResourceAction('displayViews', {
              types: document.type,
            })
          );
        });

        this.organization = this.store.select(selectResourceById('individual', id));

        this.colleges = this.document.pipe(
          map((document: any) => this.filterSubOrganization(document.hasSubOrganizations, ['College']))
        );

        this.departments = this.document.pipe(
          map((document: any) => this.filterSubOrganization(document.hasSubOrganizations, ['Department']))
        );

        this.others = this.document.pipe(
          map((document: any) => this.filterSubOrganization(document.hasSubOrganizations, ['!College', '!Department']))
        );

        this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));
      });
  }

  trackByIndex(index, item) {
    return index;
  }

  filterSubOrganization(subOrganizations: any[], types: string[]): any[] {
    return subOrganizations.filter(so => {

      for (const type of types) {
        const match = type.startsWith('!') ? so.type !== type : so.type === type;
        if (!match) {
          return false;
        }
      }

      return true;
    })
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

}
