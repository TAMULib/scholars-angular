import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { AnalyticView } from '../core/model/view';
import { AppState } from '../core/store';
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

  public analyticViews: Observable<AnalyticView[]>;

  private subscriptions: Subscription[];

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(private store: Store<AppState>) {
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.analyticViews = this.store.pipe(select(selectAllResources<AnalyticView>('analyticViews')));

    this.analyticViews.subscribe((av: any) => {
      console.log(av);
    });

    this.store.dispatch(new fromLayout.CloseSidebarAction());

    this.store.dispatch(new fromSidebar.UnloadSidebarAction());
  }

  getRoute(av: AnalyticView): string[] {
    return [av.name];
  }

  trackByIndex(index, item) {
    return index;
  }

}
