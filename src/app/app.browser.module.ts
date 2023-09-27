import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule, TransferState } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { Observable, of } from 'rxjs';
import { AppComponent } from './app.component';
import { AppModule, I18N_TRANSLATE_STATE, I18nTranslateState } from './app.module';
import { ComputedStyleLoader } from './core/computed-style-loader';
import { CustomMissingTranslationHandler } from './core/handler/custom-missing-translation.handler';

export const getRequest = (): any => {
  return { headers: { cookie: document.cookie } };
};

export const createTranslateLoader = (transferState: TransferState, http: HttpClient): TranslateLoader => {
  return {
    getTranslation: (lang: string): Observable<any> => {
      const state = transferState.get<I18nTranslateState>(I18N_TRANSLATE_STATE, {});

      return !!state[lang] ? of(state[lang]) : http.get(`assets/i18n/${lang}.json`, { responseType: 'json' });
    },
  } as TranslateLoader;
};

export const createStyleLoader = (document: Document): ComputedStyleLoader => {
  return {
    getComputedStyle(): any {
      return getComputedStyle(document.body);
    }
  } as ComputedStyleLoader;
};

@NgModule({
  bootstrap: [
    AppComponent
  ],
  imports: [
    AppModule,
    TranslateModule.forRoot({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: CustomMissingTranslationHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [TransferState, HttpClient, APP_BASE_HREF]
      }
    })
  ],
  providers: [
    {
      provide: REQUEST,
      useFactory: getRequest
    },
    {
      provide: ComputedStyleLoader,
      useFactory: createStyleLoader,
      deps: [DOCUMENT]
    }
  ]
})
export class AppBrowserModule { }
