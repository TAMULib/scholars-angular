import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RestService {

  constructor(
    private readonly http: HttpClient,
  ) {

  }

  public get<T>(url: string, options: any = {}): Observable<T> {
    // tslint:disable-next-line:no-shadowed-variable
    return this.processRequest<T>(url, options, (url: string, options: any): any => {
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
