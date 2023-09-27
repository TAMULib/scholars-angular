import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { NgModule, TransferState } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ServerModule } from '@angular/platform-server';
import { MissingTranslationHandler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { readFileSync } from 'fs';
import { Observable, of } from 'rxjs';

import { AppComponent } from './app.component';
import { AppModule, I18N_TRANSLATE_STATE, I18nTranslateState } from './app.module';
import { ComputedStyleLoader } from './core/computed-style-loader';
import { CustomMissingTranslationHandler } from './core/handler/custom-missing-translation.handler';

const createUniversalTranslateLoader = (transferState: TransferState): TranslateLoader => {
  return {
    getTranslation: (lang: string): Observable<any> => {
      const messages = JSON.parse(readFileSync(`./dist/scholars-angular/browser/assets/i18n/${lang}.json`, 'utf8'));

      const prevState = transferState.get<I18nTranslateState>(I18N_TRANSLATE_STATE, {});

      transferState.set(I18N_TRANSLATE_STATE, {
        ...prevState,
        [lang]: messages
      });

      return of(messages);
    },
  } as TranslateLoader;
};

const createUniversalStyleLoader = (document: Document, baseHref: string): ComputedStyleLoader => {
  return {
    getComputedStyle(): any {
      const styleLinkTag = document.querySelector('head > link[rel=stylesheet]');
      const stylesheet = styleLinkTag.getAttribute('href');
      const styles = readFileSync(`./dist/scholars-angular/browser/${stylesheet.replace(baseHref, '')}`, 'utf8');
      const root = styles.match(/:root.*{([^}]+)}/g)[0];
      // tslint:disable-next-line:one-variable-per-declaration
      const style = {}, [, ruleName, rule] = root.match(/ ?(.*?) ?{([^}]*)}/) || [, , root];
      const properties = rule.split(';').map((o) => o.split(':').map((x) => x && x.trim()));
      for (const [property, value] of properties) {
        if (value) {
          style[property] = value;
        }
      }
      return { root, ruleName, style, getPropertyValue: (key) => style[key] };
    },
  } as ComputedStyleLoader;
};

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    NoopAnimationsModule,
    TranslateModule.forRoot({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: CustomMissingTranslationHandler,
      },
      loader: {
        provide: TranslateLoader,
        useFactory: createUniversalTranslateLoader,
        deps: [TransferState]
      },
    }),
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: ComputedStyleLoader,
      useFactory: createUniversalStyleLoader,
      deps: [DOCUMENT, APP_BASE_HREF],
    },
  ],
})
export class AppServerModule { }
