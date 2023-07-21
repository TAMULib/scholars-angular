import { Component, Inject, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { APP_CONFIG, AppConfig } from '../../app.config';
import { AnalyticView } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectAllResources } from '../../core/store/sdr';

@Component({
  selector: 'scholars-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent implements OnInit {

  public analyticViews: Observable<AnalyticView[]>;

  private subscriptions: Subscription[];

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute
  ) {
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
  }

  getRoute(av: AnalyticView): string[] {
    return [`../${av.name}`];
  }

  trackByIndex(index, item) {
    return index;
  }

}
