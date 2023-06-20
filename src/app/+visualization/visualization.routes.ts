import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { CoAuthorNetworkComponent } from './co-author-network/co-author-network.component';
import { CoInvestigatorNetworkComponent } from './co-investigator-network/co-investigator-network.component';
import { filter } from 'rxjs';

import { VisualizationComponent } from './visualization.component';
import { ResearchAgeComponent } from './research-age/research-age.component';
import { Individual, SolrDocument } from '../core/model/discovery';
import { Store, select } from '@ngrx/store';
import { AppState } from '../core/store';
import { inject } from '@angular/core';
import { selectResourceById } from '../core/store/sdr';

import * as fromSdr from '../core/store/sdr/sdr.actions';

export const individualResolver: ResolveFn<Individual> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const store = inject(Store<AppState>);

  const id = route.params.id;

  console.log(id);

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
        path: 'Research Age',
        component: ResearchAgeComponent,
        data: {
          tags: [{ name: 'view', content: 'Organizational Research Age' }],
        },
      },
      { path: '**', redirectTo: 'Research Age' },
    ],
  },
  { path: '**', redirectTo: 'n5d3837d6/Research Age' },
];
