import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { filter, map, skipWhile, withLatestFrom } from 'rxjs/operators';

import { selectRouterQueryParams } from '.';
import { AppState } from '../';
import { FILTER_VALUE_DELIMITER } from '../../../shared/utilities/discovery.utility';
import { selectLoginRedirect } from '../auth';

import * as fromAuth from '../auth/auth.actions';
import * as fromRouter from './router.actions';

@Injectable()
export class RouterEffects {

  constructor(
    private actions: Actions,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private store: Store<AppState>
  ) {
    this.listenForRouteChange();
  }

  navigate = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.GO),
    map((action: fromRouter.Go) => action.payload),
    map(({ path, query: queryParams, extras }) =>
      this.router.navigate(path, {
        relativeTo: this.route,
        queryParams,
        ...extras,
      })
    )
  ), { dispatch: false });

  navigateByUrl = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.LINK),
    map((action: fromRouter.Link) => action.payload),
    map(({ url }) => this.router.navigateByUrl(url))
  ), { dispatch: false });

  navigateBack = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.BACK),
    map(() => this.location.back())
  ), { dispatch: false });

  navigateForward = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.FORWARD),
    map(() => this.location.forward())
  ), { dispatch: false });

  redirect = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.CHANGED),
    withLatestFrom(this.store.pipe(select(selectLoginRedirect))),
    map(([action, redirect]) => redirect),
    skipWhile((redirect: fromRouter.RouterNavigation) => redirect === undefined),
    map(() => new fromAuth.UnsetLoginRedirectAction())
  ));

  removeFilter = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.REMOVE_FILTER),
    map((action: fromRouter.RemoveFilter) => action.payload),
    withLatestFrom(this.store.pipe(select(selectRouterQueryParams))),
    map(([payload, params]) => {
      const queryParams = { ...params };

      const filter = queryParams[`${payload.filter.field}.filter`].split(FILTER_VALUE_DELIMITER)
        .filter((value: string) => value !== payload.filter.value)
        .join(FILTER_VALUE_DELIMITER);

      if (filter.trim().length === 0) {
        queryParams[`${payload.filter.field}.opKey`] = undefined;
        queryParams.filters = queryParams.filters.split(',')
          .filter((field: string) => field !== payload.filter.field)
          .join(',');
      }

      queryParams[`${payload.filter.field}.filter`] = filter;

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge'
      });
    })
  ), { dispatch: false });

  private listenForRouteChange() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.store.dispatch(new fromRouter.Changed());
    });
  }

}
