import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Client, IFrame, StompConfig, StompSubscription } from '@stomp/stompjs';
import { Observable, Observer, asapScheduler, from, of, scheduled } from 'rxjs';

import { environment } from '../../../environments/environment';
import { APP_CONFIG, AppConfig } from '../../app.config';

@Injectable({
  providedIn: 'root',
})
export class StompService {

  private client: Client;

  constructor(@Inject(APP_CONFIG) private appConfig: AppConfig, @Inject(PLATFORM_ID) private platformId: string) {

  }

  public connect(): Observable<any> {
    if (isPlatformServer(this.platformId)) {
      return scheduled([false], asapScheduler);
    }

    this.client = new Client({
      brokerURL: `${this.appConfig.brokerUrl}/connect`,
      onWebSocketError: (event: any) => {
        console.error('onWebSocketError', event);
      },
      onStompError: (frame: IFrame) => {
        console.error('onStompError', frame);
      },
      debug: (message: string) => {
        if (environment.stompDebug) {
          console.debug('debug', message);
        }
      },
    });

    this.client.activate();

    return new Observable((subscriber) => {
      this.client.onConnect = (frame: IFrame) => {
        subscriber.next(frame);
      };
    });
  }

  public disconnect(): Observable<any> {
    if (isPlatformServer(this.platformId)) {
      return scheduled([false], asapScheduler);
    }

    return from(this.client.deactivate());
  }

  public subscribe(channel: string, callback: () => {}): Observable<any> {
    if (isPlatformServer(this.platformId)) {
      return scheduled([false], asapScheduler);
    }

    return of(this.client.subscribe(channel, callback));
  }

  public unsubscribe(id: string): Observable<any> {
    return scheduled([this.client.unsubscribe(id)], asapScheduler);
  }

}
