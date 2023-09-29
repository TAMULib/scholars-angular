import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MissingTranslationHandler, TranslateModule } from '@ngx-translate/core';

import { CustomMissingTranslationHandler } from '../core/handler/custom-missing-translation.handler';
import { SharedModule } from '../shared/shared.module';
import { AdminComponent } from './admin.component';
import { routes } from './admin.routes';
import { DataAndAnalyticsViewsComponent } from './data-and-analytics-views/data-and-analytics-views.component';
import { DirectoryViewsComponent } from './directory-views/directory-views.component';
import { DiscoveryViewsComponent } from './discovery-views/discovery-views.component';
import { DisplayViewsComponent } from './display-views/display-views.component';
import { ThemesComponent } from './themes/themes.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [
    AdminComponent,
    DataAndAnalyticsViewsComponent,
    DirectoryViewsComponent,
    DiscoveryViewsComponent,
    DisplayViewsComponent,
    ThemesComponent,
    UsersComponent
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
  ],
})
export class AdminModule {

  public static routes = routes;

}
