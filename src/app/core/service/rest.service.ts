import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RestService {

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    @Inject(REQUEST) private request: any,
    private http: HttpClient,
  ) {

  }

  public hasSession(): boolean {
    // tslint:disable-next-line: no-string-literal
    return this.request.headers && this.request.headers['cookie'] && this.request.headers['cookie'].indexOf('SESSION') >= 0;
  }

  public clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      const expires = new Date('Thu, 01 Jan 1970 00:00:00 GMT');
      document.cookie = 'SESSION=;expires=' + expires.toUTCString() + ';';
    }
  }

  public get<T>(url: string, options: any = {}, cache = true): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequest<T>(url, options, (url: string, options: any): any => {
      console.log("DEBUG: processRequest url, options are: ", url, options);
      return this.http.get<T>(url, options);
    });
  }

  public post<T>(url: string, body: any = {}, options: any = {}): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequestWithData<T>(url, body, options, (url: string, body: any, options: any): any => {
      return this.http.post<T>(url, body, options);
    });
  }

  public put<T>(url: string, body: any = {}, options: any = {}): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequestWithData<T>(url, body, options, (url: string, body: any, options: any): any => {
      return this.http.put<T>(url, body, options);
    });
  }

  public patch<T>(url: string, body: any = {}, options: any = {}): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequestWithData<T>(url, body, options, (url: string, body: any, options: any): any => {
      return this.http.patch<T>(url, body, options);
    });
  }

  public delete<T>(url: string, options: any = {}): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequest<T>(url, options, (url: string, options: any): any => {
      return this.http.delete<T>(url, options);
    });
  }

  private processRequest<T>(url: string, options: any, callback: (url: string, options: any) => Observable<T>) {
    return callback(url, options).pipe(
      map((response: T) => {
        return response;
      })
    );
  }

  private processRequestWithData<T>(url: string, body: any, options: any, callback: (url: string, body: any, options: any) => Observable<T>) {
    return callback(url, body, options).pipe(
      map((response: T) => {
        return response;
      })
    );
  }

}
