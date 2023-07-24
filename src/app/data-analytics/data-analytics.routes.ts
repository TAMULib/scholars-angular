import { Routes } from '@angular/router';
import { DataAnalyticsComponent } from './data-analytics.component';

export const routes: Routes = [
  {
    path: '',
    component: DataAnalyticsComponent,
  },{
    path: ':view',
    component: DataAnalyticsComponent,
  },
];
