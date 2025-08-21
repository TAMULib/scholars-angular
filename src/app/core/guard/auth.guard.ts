import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store, select } from '@ngrx/store';

import { Observable, asapScheduler, scheduled } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

import { Role, User } from '../model/user';
import { AppState } from '../store';

import { selectIsAuthenticated, selectIsGettingUser, selectUser } from '../store/auth';

import * as fromAuth from '../store/auth/auth.actions';
import * as fromRouter from '../store/router/router.actions';

@Injectable()
export class AuthGuard {

  constructor(private store: Store<AppState>) { }

  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const roles = route.data.roles;
    return this.requiresAuthorization(roles).pipe(
      switchMap((authorize: boolean) => authorize
        ? this.isAuthorized(state.url, roles)
        : this.isAuthenticated(state.url))
    );
  }

  private requiresAuthorization(roles: Role[]): Observable<boolean> {
    return roles ? scheduled([true], asapScheduler) : scheduled([false], asapScheduler);
  }

  private isAuthorized(url: string, roles: Role[]): Observable<boolean> {
    return this.isAuthenticated(url).pipe(
      switchMap((authenticated: boolean) => authenticated ?
        this.store.pipe(
          select(selectUser),
          filter((user: User) => user !== undefined),
          map((user: User) => {
            const authorized = user ? roles.indexOf(Role[user.role]) >= 0 : false;
            if (!authorized) {
              this.store.dispatch(new fromRouter.Link({ url: '/' }));
            }
            return authorized;
          })
        ) : scheduled([false], asapScheduler)
      )
    );
  }

  private isAuthenticated(url: string): Observable<boolean> {
    return this.store.pipe(
      select(selectIsAuthenticated),
      take(1),
      switchMap((authenticated: boolean) => {
        if (!authenticated) {
          this.store.dispatch(new fromAuth.GetUserAction());

          return this.store.pipe(
            select(selectIsGettingUser),
            filter(gettingUser => !gettingUser),
            take(1),
            switchMap(() => this.store.pipe(
              select(selectIsAuthenticated),
              take(1),
              map((isAuthenticatedAfterCheck: boolean) => {
                if (!isAuthenticatedAfterCheck) {
                  this.store.dispatch(new fromRouter.Link({ url: '/' }));
                  this.store.dispatch(new fromAuth.SetLoginRedirectAction({ url }));
                }
                return isAuthenticatedAfterCheck;
              })
            ))
          );
        } else {
          return scheduled([true], asapScheduler);
        }
      })
    );
  }

}
