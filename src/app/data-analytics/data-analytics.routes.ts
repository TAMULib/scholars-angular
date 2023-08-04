import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs';

import { Individual, SolrDocument } from '../core/model/discovery';
import { AppState } from '../core/store';
import { selectResourceById } from '../core/store/sdr';
import { DataAnalyticsComponent } from './data-analytics.component';

import * as fromSdr from '../core/store/sdr/sdr.actions';

export const individualSubOrganizationResolver: ResolveFn<Individual> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store<AppState>);

  const id = route.params.organization;

  store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));

  return store.pipe(
    select(selectResourceById('individual', id)),
    filter((document: SolrDocument) => document !== undefined)
  );
};

export const routes: Routes = [
  {
    path: '',
    component: DataAnalyticsComponent,
  },
  // {
  //   path: ':view',
  //   redirectTo: ':view/n5d3837d6'
  // },
  {
    path: ':view/:organization',
    component: DataAnalyticsComponent,
    resolve: {
      selectedOrganization: individualSubOrganizationResolver
    },
  },
];
