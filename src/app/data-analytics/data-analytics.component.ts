import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, withLatestFrom } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../app.config';
import { SolrDocument } from '../core/model/discovery';
import { AnalyticView } from '../core/model/view';
import { AppState } from '../core/store';
import { selectRouterState } from '../core/store/router';
import { selectAllResources, selectResourceById } from '../core/store/sdr';
import { fadeIn } from '../shared/utilities/animation.utility';

import * as fromLayout from '../core/store/layout/layout.actions';
import * as fromSdr from '../core/store/sdr/sdr.actions';
import * as fromSidebar from '../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-data-analytics',
  templateUrl: './data-analytics.component.html',
  styleUrls: ['./data-analytics.component.scss'],
  animations: [fadeIn],
})
export class DataAnalyticsComponent implements OnInit {

  public analyticViews: Observable<AnalyticView[]>;

  public isDashboard: Observable<boolean>;

  public analyticView: Observable<AnalyticView>;

  public document: Observable<SolrDocument>;

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(
    private store: Store<AppState>,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
  ) {

  }

  ngOnInit(): void {
    // TODO: get organization id from the theme
    this.document = this.store.pipe(
      select(selectResourceById('individual', this.appConfig.organizationId)),
      filter((document: SolrDocument) => document !== undefined)
    );

    this.store.dispatch(new fromLayout.CloseSidebarAction());
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());

    this.analyticViews = this.store.pipe(select(selectAllResources<AnalyticView>('analyticViews')));

    this.analyticView = this.store.pipe(
      select(selectRouterState),
      withLatestFrom(this.analyticViews),
      map(([router, avs]) => avs.find((av: AnalyticView) => !!router && av.name === router.state.params.view))
    );

    this.isDashboard = this.store.pipe(
      select(selectRouterState),
      map((router: any) => !!router && router.state.url  === '/data-analytics')
    );

    this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id: this.appConfig.organizationId }));
  }

  trackByIndex(index, item) {
    return index;
  }

}
