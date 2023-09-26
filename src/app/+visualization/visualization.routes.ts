import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { filter } from 'rxjs';

import { Individual } from '../core/model/discovery';
import { AppState } from '../core/store';
import { selectResourceById } from '../core/store/sdr';
import { CoAuthorNetworkComponent } from './co-author-network/co-author-network.component';
import { CoInvestigatorNetworkComponent } from './co-investigator-network/co-investigator-network.component';
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
    filter((individual: Individual) => individual !== undefined)
  );
};

export const routes: Routes = [
  {
    path: ':id',
    component: VisualizationComponent,
    resolve: {
      individual: individualResolver
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
      { path: '**', redirectTo: 'Co-author Network' },
    ],
  },
  { path: '**', redirectTo: '/' },
];
