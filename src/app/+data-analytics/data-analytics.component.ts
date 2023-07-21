import { Component, Inject, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { AnalyticView } from '../core/model/view';
import { APP_CONFIG, AppConfig } from '../app.config';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core/store';
import { ActivatedRoute, Router } from '@angular/router';
import { selectAllResources } from '../core/store/sdr';

@Component({
  selector: 'scholars-data-analytics',
  templateUrl: './data-analytics.component.html',
  styleUrls: ['./data-analytics.component.scss']
})
export class DataAnalyticsComponent implements OnInit {

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

}
