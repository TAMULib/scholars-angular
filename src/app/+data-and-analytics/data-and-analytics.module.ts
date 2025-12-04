import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';

import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';
import { SharedModule } from '../shared/shared.module';
import { AcademicAgeGroupComponent } from './academic-age-group/academic-age-group.component';
import { BarplotComponent } from './academic-age-group/barplot/barplot.component';
import { DataAndAnalyticsComponent } from './data-and-analytics.component';
import { routes } from './data-and-analytics.routes';
import { FrequencyGraphComponent } from './frequency-graph/frequency-graph.component';
import { ScatterplotComponent } from './frequency-graph/scatterplot/scatterplot.component';
import { ProfileSummariesExportComponent } from './profile-summaries-export/profile-summaries-export.component';
import { QuantityDistributionComponent } from './quantity-distribution/quantity-distribution.component';
import { SortOrgPeople } from '../shared/utilities/sort-org-people.pipe';

@NgModule({
  declarations: [
    AcademicAgeGroupComponent,
    BarplotComponent,
    DataAndAnalyticsComponent,
    FrequencyGraphComponent,
    ProfileSummariesExportComponent,
    QuantityDistributionComponent,
    ScatterplotComponent,
    SortOrgPeople
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
    NgxSliderModule
  ]
})
export class DataAndAnalyticsModule {

  public static routes = routes;

}
