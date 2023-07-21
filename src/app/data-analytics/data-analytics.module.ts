import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';

import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';
import { SharedModule } from '../shared/shared.module';
import { DataAnalyticsComponent } from './data-analytics.component';
import { routes } from './data-analytics.routes';
import { AcademicAgeGroupComponent } from './academic-age-group/academic-age-group.component';
import { UnSdgComponent } from './un-sdg/un-sdg.component';
import { ProfileSummaryComponent } from './profile-summary/profile-summary.component';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';

@NgModule({
  declarations: [
    DataAnalyticsComponent,
    AcademicAgeGroupComponent,
    UnSdgComponent,
    ProfileSummaryComponent,
    AnalyticsDashboardComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    TranslateModule.forChild({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: CustomMissingTranslationHandler,
      },
      isolate: false,
    }),
    RouterModule.forChild(routes),
  ]
})
export class DataAnalyticsModule {

  public static routes = routes;

}
