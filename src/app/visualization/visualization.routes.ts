import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs';

import { AuthGuard } from '../core/guard/auth.guard';
import { Individual, SolrDocument } from '../core/model/discovery';
import { Role } from '../core/model/user';
import { AppState } from '../core/store';
import { selectResourceById } from '../core/store/sdr';
import { CoAuthorNetworkComponent } from './co-author-network/co-author-network.component';
import { CoInvestigatorNetworkComponent } from './co-investigator-network/co-investigator-network.component';
import { ResearchAgeComponent } from './research-age/research-age.component';
import { QuantityDistributionComponent } from './quantity-distribution/quantity-distribution.component';
import { VisualizationComponent } from './visualization.component';

import * as fromSdr from '../core/store/sdr/sdr.actions';

export const individualResolver: ResolveFn<Individual> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store<AppState>);

  const id = route.params.id;

  store.dispatch(new fromSdr.GetOneResourceAction('individual', { id }));

  return store.pipe(
    select(selectResourceById('individual', id)),
    filter((document: SolrDocument) => document !== undefined)
  );
};

export const routes: Routes = [
  {
    path: ':id',
    component: VisualizationComponent,
    resolve: {
      document: individualResolver
    },
    children: [
      {
        path: 'Co-author Network',
        component: CoAuthorNetworkComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Co-author Network' }],
        },
      },
      {
        path: 'Co-investigator Network',
        component: CoInvestigatorNetworkComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Co-investigator Network' }],
        },
      },
      {
        path: 'Quantity Distribution',
        component: QuantityDistributionComponent,
        canActivate: [],
        data: {
          roles: [Role.ROLE_SUPER_ADMIN, Role.ROLE_ADMIN],
          tags: [{ name: 'view', content: 'Quantity Distribution' }],
        },
      },
      {
        path: 'Research Age',
        component: ResearchAgeComponent,
        canActivate: [],
        data: {
          roles: [Role.ROLE_SUPER_ADMIN, Role.ROLE_ADMIN],
          tags: [{ name: 'view', content: 'Organizational Research Age' }],
        },
      },
      { path: '**', redirectTo: 'Research Age' },
    ],
  },
  { path: '**', redirectTo: 'n5d3837d6/Research Age' },
];
