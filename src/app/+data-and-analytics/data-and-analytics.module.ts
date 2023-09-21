import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';

import { SharedModule } from '../shared/shared.module';

import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';

import { AcademicAgeGroupComponent } from './academic-age-group/academic-age-group.component';
import { BarplotComponent } from './academic-age-group/barplot/barplot.component';
import { DataAndAnalyticsComponent } from './data-and-analytics.component';
import { ProfileSummariesExportComponent } from './profile-summaries-export/profile-summaries-export.component';
import { QuantityDistributionComponent } from './quantity-distribution/quantity-distribution.component';

import { routes } from './data-and-analytics.routes';

@NgModule({
  declarations: [
    AcademicAgeGroupComponent,
    BarplotComponent,
    DataAndAnalyticsComponent,
    ProfileSummariesExportComponent,
    QuantityDistributionComponent
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
export class DataAndAnalyticsModule {

  public static routes = routes;

}
