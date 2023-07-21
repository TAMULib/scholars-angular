import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataAnalyticsComponent } from './data-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: DataAnalyticsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataAnalyticsRoutingModule { }
