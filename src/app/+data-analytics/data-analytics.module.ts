import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataAnalyticsRoutingModule } from './data-analytics-routing.module';
import { DataAnalyticsComponent } from './data-analytics.component';


@NgModule({
  declarations: [
    DataAnalyticsComponent
  ],
  imports: [
    CommonModule,
    DataAnalyticsRoutingModule
  ]
})
export class DataAnalyticsModule { }
