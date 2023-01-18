import { Routes } from '@angular/router';
import { CoAuthorNetworkComponent } from './co-author-network/co-author-network.component';
import { CoInvestigatorNetworkComponent } from './co-investigator-network/co-investigator-network.component';

import { VisualizationComponent } from './visualization.component';

export const routes: Routes = [
  {
    path: ':id',
    component: VisualizationComponent,
    children: [
      {
        path: 'co-author',
        component: CoAuthorNetworkComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Co-Author Network' }],
        },
      },
      {
        path: 'co-investigator',
        component: CoInvestigatorNetworkComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Co-Investigator Network' }],
        },
      },
      { path: '**', redirectTo: 'co-author' },
    ],
  },
];
