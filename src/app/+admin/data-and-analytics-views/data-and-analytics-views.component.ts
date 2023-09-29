import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SdrPage } from '../../core/model/sdr';
import { DataAndAnalyticsView } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectAllResources, selectResourcesPage } from '../../core/store/sdr';

@Component({
  selector: 'scholars-data-and-analytics-views',
  templateUrl: './data-and-analytics-views.component.html',
  styleUrls: ['./data-and-analytics-views.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DataAndAnalyticsViewsComponent implements OnInit {

  public dataAndAnalyticsViews: Observable<DataAndAnalyticsView[]>;

  public page: Observable<SdrPage>;

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    this.dataAndAnalyticsViews = this.store.pipe(select(selectAllResources<DataAndAnalyticsView>('dataAndAnalyticsViews')));
    this.page = this.store.pipe(select(selectResourcesPage<DataAndAnalyticsView>('dataAndAnalyticsViews')));
  }

}
