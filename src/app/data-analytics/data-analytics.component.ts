import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, Subscription, map } from 'rxjs';

import { AnalyticView } from '../core/model/view';
import { AppState } from '../core/store';
import { selectRouterState } from '../core/store/router';
import { selectAllResources } from '../core/store/sdr';
import { fadeIn } from '../shared/utilities/animation.utility';

import * as fromLayout from '../core/store/layout/layout.actions';
import * as fromSidebar from '../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-data-analytics',
  templateUrl: './data-analytics.component.html',
  styleUrls: ['./data-analytics.component.scss'],
  animations: [fadeIn],
})
export class DataAnalyticsComponent implements OnDestroy, OnInit {

  private dashboardBreadcrumb: {
    label: string;
    route: string[]
  } = {
    label: 'Data Analytics Dashboard',
    route: ['/data-analytics']
  };

  public breadcrumbs: BehaviorSubject<any>;

  public analyticViews: Observable<AnalyticView[]>;

  public isDashboard: Observable<boolean>;

  public analyticView: Subject<AnalyticView>;

  private subscriptions: Subscription[];

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(private store: Store<AppState>) {
    this.subscriptions = [];
    this.breadcrumbs = new BehaviorSubject<any>([{
      label: 'Data Analytics Dashboard',
      route: ['/data-analytics']
    }]);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.analyticViews = this.store.pipe(select(selectAllResources<AnalyticView>('analyticViews')));

    this.isDashboard = this.store.pipe(
      select(selectRouterState),
      map((router: any) => {
        console.log(router);
        const isNotShadowDashboard = router.state.params.view === 'Dashboard';

        if (isNotShadowDashboard) {
          this.breadcrumbs.next(
            [
              this.dashboardBreadcrumb
            ]
          );
        } else {
          this.breadcrumbs.next(
            [
              this.dashboardBreadcrumb,
              {
                label: router.state.params.view,
                route: [`/data-analytics/${router.state.params.view}`]
              }
            ]
          );
        }

        return isNotShadowDashboard;
      })
    );

    this.analyticViews.subscribe((av: any) => {
      console.log(av);
    });

    this.store.dispatch(new fromLayout.CloseSidebarAction());
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());
  }

  getRoute(av: AnalyticView): string[] {
    return ['../', av.name];
  }

  trackByIndex(index, item) {
    return index;
  }

}
