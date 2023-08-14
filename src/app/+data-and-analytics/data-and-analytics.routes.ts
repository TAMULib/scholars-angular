import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs';

import { DataAndAnalyticsView } from '../core/model/view';
import { AppState } from '../core/store';
import { selectCollectionViewByName } from '../core/store/sdr';
import { DataAndAnalyticsComponent } from './data-and-analytics.component';

export const dataAndAnalyticsViewResolver: ResolveFn<DataAndAnalyticsView> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store<AppState>);

  const name = route.params.view;

  return store.pipe(
    select(selectCollectionViewByName('dataAndAnalyticsViews', name)),
    filter((view: DataAndAnalyticsView) => view !== undefined)
  );
};

export const routes: Routes = [
  {
    path: ':view',
    component: DataAndAnalyticsComponent,
    pathMatch: 'full',
    resolve: {
      view: dataAndAnalyticsViewResolver
    }
  },
  {
    path: '',
    component: DataAndAnalyticsComponent
  },
];
