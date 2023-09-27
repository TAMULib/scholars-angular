import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule, makeStateKey } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { TranslateModule } from '@ngx-translate/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_CONFIG, AppConfig } from './app.config';
import { CoreModule } from './core/core.module';
import { RootStoreModule } from './core/store/root-store.module';
import { FooterModule } from './footer/footer.module';
import { HeaderModule } from './header/header.module';
import { SharedModule } from './shared/shared.module';

export class I18nTranslateState {
  [lang: string]: {
    [key: string]: string
  }
}

export const I18N_TRANSLATE_STATE = makeStateKey<I18nTranslateState>('I18N_TRANSLATE_STATE');

const getBaseHref = (document: Document, appConfig: AppConfig): string => {
  const baseTag = document.querySelector('head > base');
  baseTag.setAttribute('href', appConfig.baseHref);
  return baseTag.getAttribute('href');
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TransferHttpCacheModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    CoreModule.forRoot(),
    NgbModule,
    SharedModule,
    HeaderModule,
    FooterModule,
    RootStoreModule
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
      deps: [DOCUMENT, APP_CONFIG]
    },
  ]
})
export class AppModule { }
