import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';

import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';
import { SharedModule } from '../shared/shared.module';
import { BarplotComponent } from './barplot/barplot.component';
import { DataAnalyticsComponent } from './data-analytics.component';
import { routes } from './data-analytics.routes';
import { QuantityDistributionComponent } from './quantity-distribution/quantity-distribution.component';
import { ResearchAgeComponent } from './research-age/research-age.component';

@NgModule({
  declarations: [
    DataAnalyticsComponent,
    BarplotComponent,
    QuantityDistributionComponent,
    ResearchAgeComponent
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
