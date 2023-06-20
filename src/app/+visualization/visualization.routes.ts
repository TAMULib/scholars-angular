import { Routes } from '@angular/router';
import { CoAuthorNetworkComponent } from './co-author-network/co-author-network.component';
import { CoInvestigatorNetworkComponent } from './co-investigator-network/co-investigator-network.component';

import { VisualizationComponent } from './visualization.component';
import { ResearchAgeComponent } from './research-age/research-age.component';

export const routes: Routes = [
  {
    path: ':id',
    component: VisualizationComponent,
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
