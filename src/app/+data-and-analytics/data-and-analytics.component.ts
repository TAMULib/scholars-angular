import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../app.config';
import { AppState } from '../core/store';

@Component({
  selector: 'scholars-data-and-analytics',
  templateUrl: 'data-and-analytics.component.html',
  styleUrls: ['data-and-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataAndAnalyticsComponent implements OnDestroy {

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

}
