import { Routes } from '@angular/router';

import { DataAndAnalyticsComponent } from './data-and-analytics.component';

export const routes: Routes = [
  {
    path: ':view',
    component: DataAndAnalyticsComponent,
    pathMatch: 'full',
  },
  // TODO: dynamic redirect to first data and analytics view
  { path: '**', redirectTo: 'Publications by Academic Age Group' },
];
