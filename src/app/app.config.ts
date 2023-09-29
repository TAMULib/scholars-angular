import { InjectionToken } from '@angular/core';

interface AppConfig {
  host: string;
  port: number;
  baseHref: string;
  brokerUrl: string;
  serviceUrl: string;
  uiUrl: string;
  embedUrl: string;
  vivoUrl: string;
  vivoEditorUrl: string;
  collectSearchStats: boolean;
}

const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export {
  AppConfig,
  APP_CONFIG
};
