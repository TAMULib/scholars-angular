import { Routes } from '@angular/router';
import { DataAnalyticsComponent } from './data-analytics.component';
import { AcademicAgeGroupComponent } from './academic-age-group/academic-age-group.component';
import { UnSdgComponent } from './un-sdg/un-sdg.component';
import { ProfileSummaryComponent as ProfileSummaryExportComponent } from './profile-summary/profile-summary.component';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DataAnalyticsComponent,
    children: [
      {
        path: 'Dashboard',
        component: AnalyticsDashboardComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Data & Analytics Dashboard' }],
        },
      },
      {
        path: 'Texas A&M Publications by Academic Age Group',
        component: AcademicAgeGroupComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Academic Age Group Analytics' }],
        },
      },
      {
        path: 'Texas A&M Research by UN SDG',
        component: UnSdgComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars UN SDG Analytics' }],
        },
      },
      {
        path: 'Download Profile Summaries by Department',
        component: ProfileSummaryExportComponent,
        data: {
          tags: [{ name: 'view', content: 'Scholars Profile Summary Export' }],
        },
      },
      { path: '**', redirectTo: 'Dashboard' },
    ]
  }
];
