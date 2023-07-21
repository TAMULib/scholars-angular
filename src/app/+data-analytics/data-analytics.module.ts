import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';
import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';

import { VisualizationModule } from '../+visualization';
import { SharedModule } from '../shared/shared.module';
import { DataAnalyticsRoutingModule } from './data-analytics-routing.module';
import { DataAnalyticsComponent } from './data-analytics.component';

@NgModule({
  declarations: [
    DataAnalyticsComponent,
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
    DataAnalyticsRoutingModule,
    VisualizationModule
  ]
})
export class DataAnalyticsModule { }
