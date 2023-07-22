import { Routes } from '@angular/router';
import { DataAnalyticsComponent } from './data-analytics.component';

export const routes: Routes = [
  {
    path: ':view',
    component: DataAnalyticsComponent
  },
  { path: '**', redirectTo: 'Dashboard' },
];
