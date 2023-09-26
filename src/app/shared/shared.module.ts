import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { AlertComponent } from './alert/alert.component';
import { DialogComponent } from './dialog/dialog.component';
import { FacetEntriesComponent } from './dialog/facet-entries/facet-entries.component';
import { LoginComponent } from './dialog/login/login.component';
import { NotificationComponent } from './dialog/notification/notification.component';
import { RegistrationComponent } from './dialog/registration/registration.component';
import { SearchTipsComponent } from './dialog/search-tips/search-tips.component';
import { UserEditComponent } from './dialog/user-edit/user-edit.component';
import { GridViewComponent } from './grid-view/grid-view.component';
import { ListViewComponent } from './list-view/list-view.component';
import { NavigationComponent } from './navigation/navigation.component';
import { PaginationComponent } from './pagination/pagination.component';
import { RecentCarouselComponent } from './recent-carousel/recent-carousel.component';
import { ResultViewComponent } from './result-view/result-view.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { StatsBoxComponent } from './stats-box/stats-box.component';
import { SustainableDevelopmentGoalsComponent } from './sustainable-development-goals/sustainable-development-goals.component';
import { TwitterComponent } from './twitter/twitter.component';
import { FormalizePipe } from './utilities/formalize.pipe';
import { SafeHtmlPipe } from './utilities/safe-html.pipe';
import { SafeUrlPipe } from './utilities/safe-url.pipe';
import { YouTubeComponent } from './youtube/youtube.component';

const MODULES = [
  CommonModule,
  NgbModule,
  FormsModule,
  ReactiveFormsModule,
  TranslateModule,
  RouterModule
];

const PIPES = [
  FormalizePipe,
  SafeHtmlPipe,
  SafeUrlPipe
];

const COMPONENTS = [
  AlertComponent,
  DialogComponent,
  FacetEntriesComponent,
  GridViewComponent,
  ListViewComponent,
  LoginComponent,
  NavigationComponent,
  PaginationComponent,
  RecentCarouselComponent,
  RegistrationComponent,
  ResultViewComponent,
  SearchBoxComponent,
  SearchTipsComponent,
  SidebarComponent,
  StatsBoxComponent,
  SustainableDevelopmentGoalsComponent,
  TwitterComponent,
  YouTubeComponent
];

const DIRECTIVES = [

];

const ENTRY_COMPONENTS = [
  FacetEntriesComponent,
  LoginComponent,
  RegistrationComponent,
  NotificationComponent,
  UserEditComponent
];

@NgModule({
  declarations: [
    ...PIPES,
    ...COMPONENTS,
    ...DIRECTIVES,
    ...ENTRY_COMPONENTS
  ],
  exports: [
    ...MODULES,
    ...PIPES,
    ...COMPONENTS,
    ...DIRECTIVES
  ],
  imports: [
    ...MODULES
  ]
})
export class SharedModule { }
