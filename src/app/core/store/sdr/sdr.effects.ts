import { Injectable, Injector } from '@angular/core';
import { Params } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, asapScheduler, combineLatest, defer, scheduled } from 'rxjs';
import { catchError, filter, map, mergeMap, skipWhile, switchMap, take, withLatestFrom } from 'rxjs/operators';

import { AppState } from '../';
import { FILTER_VALUE_DELIMITER, buildDateYearFilterValue, buildNumberRangeFilterValue, createSdrRequest, getFacetFilterLabel } from '../../../shared/utilities/discovery.utility';
import { removeFilterFromQueryParams } from '../../../shared/utilities/view.utility';
import { Individual } from '../../model/discovery';
import { injectable, repos } from '../../model/repos';
import { Count, SdrCollection, SdrFacet, SdrFacetEntry, SdrResource } from '../../model/sdr';
import { AbstractSdrRepo } from '../../model/sdr/repo/abstract-sdr-repo';
import { SidebarItem, SidebarItemType, SidebarMenu, SidebarSection } from '../../model/sidebar';
import { DirectoryView, DiscoveryView, Facet, FacetType, OpKey } from '../../model/view';
import { AlertService } from '../../service/alert.service';
import { DialogService } from '../../service/dialog.service';
import { StatsService } from '../../service/stats.service';
import { selectRouterState } from '../router';
import { CustomRouterState } from '../router/router.reducer';
import { selectIsStompConnected, selectStompState } from '../stomp';
import { StompState } from '../stomp/stomp.reducer';
import { selectSdrState } from './';
import { AcademicAge, DataNetwork, QuantityDistribution, SdrState } from './sdr.reducer';

import * as fromDialog from '../dialog/dialog.actions';
import * as fromRouter from '../router/router.actions';
import * as fromSidebar from '../sidebar/sidebar.actions';
import * as fromStomp from '../stomp/stomp.actions';
import * as fromSdr from './sdr.actions';

@Injectable()
export class SdrEffects {

  private repos: Map<string, AbstractSdrRepo<SdrResource>>;

  constructor(
    private actions: Actions,
    private injector: Injector,
    private store: Store<AppState>,
    private alert: AlertService,
    private dialog: DialogService,
    private stats: StatsService,
    private translate: TranslateService
  ) {
    this.repos = new Map<string, AbstractSdrRepo<SdrResource>>();
    this.injectRepos();
  }

  // TODO: alerts should be in dialog location if a dialog is opened

  getAll = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ALL)),
    mergeMap((action: fromSdr.GetAllResourcesAction) =>
      this.repos
        .get(action.name)
        .getAll()
        .pipe(
          map(
            (collection: SdrCollection) =>
              new fromSdr.GetAllResourcesSuccessAction(action.name, {
                collection,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.GetAllResourcesFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getAllSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ALL_SUCCESS)),
    switchMap((action: fromSdr.GetAllResourcesSuccessAction) => this.waitForStompConnection(action.name)),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  getAllFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ALL_FAILURE)),
    map((action: fromSdr.GetAllResourcesFailureAction) => this.alert.getAllFailureAlert(action.payload))
  ));

  getOne = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ONE)),
    switchMap((action: fromSdr.GetOneResourceAction) =>
      this.repos
        .get(action.name)
        .getOne(action.payload.id)
        .pipe(
          map((individual: Individual) => new fromSdr.GetOneResourceSuccessAction(action.name, { individual, queue: action.payload.queue })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.GetOneResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getOneSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ONE_SUCCESS)),
    switchMap((action: fromSdr.GetOneResourceSuccessAction) => {
      if (!!action.payload.queue && action.payload.queue.length > 0) {
        this.store.dispatch(action.payload.queue.pop());
      }
      return this.waitForStompConnection(action.name);
    }),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  getOneFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ONE_FAILURE)),
    map((action: fromSdr.GetOneResourceFailureAction) => this.alert.getOneFailureAlert(action.payload))
  ));

  getNetwork = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_NETWORK)),
    switchMap((action: fromSdr.GetNetworkAction) =>
      this.repos
        .get(action.name)
        .getNetwork(action.payload.id, action.payload.dateField, action.payload.dataFields, action.payload.typeFilter)
        .pipe(
          map((dataNetwork: DataNetwork) => new fromSdr.GetNetworkSuccessAction(action.name, { dataNetwork })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.GetNetworkFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getNetworkSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_NETWORK_SUCCESS)),
    switchMap((action: fromSdr.GetNetworkSuccessAction) => this.waitForStompConnection(action.name)),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  getNetworkFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_NETWORK_FAILURE)),
    map((action: fromSdr.GetNetworkFailureAction) => this.alert.getNetworkFailureAlert(action.payload))
  ));

  getAcademicAge = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ACADEMIC_AGE)),
    switchMap((action: fromSdr.GetAcademicAgeAction) =>
      this.repos
        .get(action.name)
        .getAcademicAge(action.payload.query, action.payload.filters, action.payload.label, action.payload.dateField, action.payload.accumulateMultivaluedDate, action.payload.averageOverInterval, action.payload.upperLimitInYears, action.payload.groupingIntervalInYears)
        .pipe(
          map((academicAge: AcademicAge) => new fromSdr.GetAcademicAgeSuccessAction(action.name, { academicAge, queue: action.payload.queue })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.GetAcademicAgeFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getAcademicAgeSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ACADEMIC_AGE_SUCCESS)),
    // TODO: determine utility and use of stomp connection for each success action dispatched (only applicable to asynchronous REST actions in which we want to switch to full duplex)
    // switchMap((action: fromSdr.GetAcademicAgeSuccessAction) => this.waitForStompConnection(action.name)),
    // withLatestFrom(this.store.pipe(select(selectStompState))),
    map((action: fromSdr.GetAcademicAgeSuccessAction) => {
      if (action.payload.queue.length > 0) {
        this.store.dispatch(action.payload.queue.pop());
      }
    })
  ), { dispatch: false });

  getAcademicAgeFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_ACADEMIC_AGE_FAILURE)),
    map((action: fromSdr.GetAcademicAgeFailureAction) => this.alert.getAcademicAgeFailureAlert(action.payload))
  ));

  getQuantityDistribution = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_QUANTITY_DISTRIBUTION)),
    switchMap((action: fromSdr.GetQuantityDistributionAction) =>
      this.repos
        .get(action.name)
        .getQuantityDistribution(action.payload.query, action.payload.filters, action.payload.label, action.payload.field)
        .pipe(
          map((quantityDistribution: QuantityDistribution) => new fromSdr.GetQuantityDistributionSuccessAction(action.name, { quantityDistribution, queue: action.payload.queue })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.GetQuantityDistributionFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getQuantityDistributionSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_QUANTITY_DISTRIBUTION_SUCCESS)),
    // TODO: determine utility and use of stomp connection for each success action dispatched (only applicable to asynchronous REST actions in which we want to switch to full duplex)
    // switchMap((action: fromSdr.GetQuantityDistributionSuccessAction) => this.waitForStompConnection(action.name)),
    // withLatestFrom(this.store.pipe(select(selectStompState))),
    map((action: fromSdr.GetQuantityDistributionSuccessAction) => {
      if (action.payload.queue.length > 0) {
        this.store.dispatch(action.payload.queue.pop());
      }
    })
  ), { dispatch: false });

  getQuantityDistributionFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.GET_QUANTITY_DISTRIBUTION_FAILURE)),
    map((action: fromSdr.GetQuantityDistributionFailureAction) => this.alert.getQuantityDistributionFailureAlert(action.payload))
  ));

  findByIdIn = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_ID_IN)),
    mergeMap((action: fromSdr.FindByIdInResourceAction) =>
      this.repos
        .get(action.name)
        .findByIdIn(action.payload.ids)
        .pipe(
          map(
            (collection: SdrCollection) =>
              new fromSdr.FindByIdInResourceSuccessAction(action.name, {
                collection,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.FindByIdInResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  findByIdInSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_ID_IN_SUCCESS)),
    switchMap((action: fromSdr.FindByIdInResourceSuccessAction) => this.waitForStompConnection(action.name)),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  findByIdInFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_ID_IN_FAILURE)),
    map((action: fromSdr.FindByIdInResourceFailureAction) => this.alert.findByIdInFailureAlert(action.payload))
  ));

  findByTypesIn = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_TYPES_IN)),
    switchMap((action: fromSdr.FindByTypesInResourceAction) =>
      this.repos
        .get(action.name)
        .findByTypesIn(action.payload.types)
        .pipe(
          map(
            (individual: Individual) =>
              new fromSdr.FindByTypesInResourceSuccessAction(action.name, {
                individual,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.FindByTypesInResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  findByTypesInSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_TYPES_IN_SUCCESS)),
    switchMap((action: fromSdr.FindByTypesInResourceSuccessAction) => this.waitForStompConnection(action.name)),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  findByTypesInFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FIND_BY_TYPES_IN_FAILURE)),
    map((action: fromSdr.FindByTypesInResourceFailureAction) => this.alert.findByTypesInFailureAlert(action.payload))
  ));

  fetchLazyReference = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FETCH_LAZY_REFERENCE)),
    switchMap((action: fromSdr.FetchLazyReferenceAction) => {
      const field = action.payload.field;
      const individual = action.payload.individual;
      const ids = Array.isArray(individual[field]) ? individual[field].map((property) => property.id) : [individual[field].id];
      return this.repos
        .get('individual')
        .findByIdIn(ids)
        .pipe(
          map(
            (resources: SdrCollection) =>
              new fromSdr.FetchLazyReferenceSuccessAction(action.name, {
                individual,
                field,
                resources,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.FetchLazyReferenceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        );
    })
  ));

  fetchLazyReferenceFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.FETCH_LAZY_REFERENCE_FAILURE)),
    map((action: fromSdr.FetchLazyReferenceFailureAction) => this.alert.fetchLazyRefernceFailureAlert(action.payload))
  ));

  page = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PAGE)),
    switchMap((action: fromSdr.PageResourcesAction) =>
      this.repos
        .get(action.name)
        .page(action.payload.request)
        .pipe(
          map(
            (collection: SdrCollection) =>
              new fromSdr.PageResourcesSuccessAction(action.name, {
                collection,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.PageResourcesFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  pageSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PAGE_SUCCESS)),
    switchMap((action: fromSdr.PageResourcesSuccessAction) => this.waitForStompConnection(action.name)),
    withLatestFrom(this.store.pipe(select(selectStompState))),
    map(([combination, stomp]) => this.subscribeToResourceQueue(combination[0], stomp))
  ), { dispatch: false });

  pageFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PAGE_FAILURE)),
    map((action: fromSdr.PageResourcesFailureAction) => this.alert.pageFailureAlert(action.payload))
  ));

  search = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.SEARCH)),
    switchMap((action: fromSdr.SearchResourcesAction) =>
      this.repos
        .get(action.name)
        .search(action.payload.request)
        .pipe(
          map(
            (collection: SdrCollection) =>
              new fromSdr.SearchResourcesSuccessAction(action.name, {
                collection,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.SearchResourcesFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  searchSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.SEARCH_SUCCESS)),
    switchMap((action: fromSdr.SearchResourcesSuccessAction) =>
      combineLatest([
        scheduled([action], asapScheduler),
        this.store.pipe(
          select(selectRouterState),
          take(1)
        ),
        this.store.pipe(
          select(selectSdrState('directoryViews')),
          filter((directory: SdrState<DirectoryView>) => directory !== undefined)
        ),
        this.store.pipe(
          select(selectSdrState('discoveryViews')),
          filter((discovery: SdrState<DiscoveryView>) => discovery !== undefined)
        )
      ])
    ),
    map((latest) => {
      return this.searchSuccessHandler({
        action: latest[0],
        route: latest[1].state,
        directory: latest[2] as SdrState<DirectoryView>,
        discovery: latest[3] as SdrState<DiscoveryView>
      });
    })
  ), { dispatch: false });

  searchFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.SEARCH_FAILURE)),
    map((action: fromSdr.SearchResourcesFailureAction) => this.alert.searchFailureAlert(action.payload))
  ));

  count = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.COUNT)),
    mergeMap((action: fromSdr.CountResourcesAction) =>
      this.repos
        .get(action.name)
        .count(action.payload.request)
        .pipe(
          map(
            (count: Count) =>
              new fromSdr.CountResourcesSuccessAction(action.name, {
                label: action.payload.label,
                count,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.CountResourcesFailureAction(action.name, {
                  label: action.payload.label,
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  countFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.COUNT_FAILURE)),
    map((action: fromSdr.CountResourcesFailureAction) => this.alert.countFailureAlert(action.payload))
  ));

  recentlyUpdated = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.RECENTLY_UPDATED)),
    mergeMap((action: fromSdr.RecentlyUpdatedResourcesAction) =>
      this.repos
        .get(action.name)
        .recentlyUpdated(action.payload.limit, action.payload.filters)
        .pipe(
          map(
            (recentlyUpdated: SdrResource[]) =>
              new fromSdr.RecentlyUpdatedResourcesSuccessAction(action.name, {
                recentlyUpdated,
              })
          ),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.RecentlyUpdatedResourcesFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  getRecentlyUpdatedFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.RECENTLY_UPDATED_FAILURE)),
    map((action: fromSdr.RecentlyUpdatedResourcesFailureAction) => this.alert.recentlyUpdatedFailureAlert(action.payload))
  ));

  clearResourceSubscription = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.CLEAR)),
    map((action: fromSdr.ClearResourcesAction) => new fromStomp.UnsubscribeAction({ channel: `/queue/${action.name}` }))
  ));

  post = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.POST)),
    switchMap((action: fromSdr.PostResourceAction) =>
      this.repos
        .get(action.name)
        .post(action.payload.resource)
        .pipe(
          map((resource: SdrResource) => new fromSdr.PostResourceSuccessAction(action.name, { resource })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.PostResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  postSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.POST_SUCCESS)),
    switchMap((action: fromSdr.PostResourceSuccessAction) => [new fromDialog.CloseDialogAction(), this.alert.postSuccessAlert(action)])
  ));

  postFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.POST_FAILURE)),
    map((action: fromSdr.PostResourceFailureAction) => this.alert.postFailureAlert(action.payload))
  ));

  put = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PUT)),
    switchMap((action: fromSdr.PutResourceAction) =>
      this.repos
        .get(action.name)
        .put(action.payload.resource)
        .pipe(
          map((resource: SdrResource) => new fromSdr.PutResourceSuccessAction(action.name, { resource })),
          catchError((response) => scheduled([new fromSdr.PutResourceFailureAction(action.name, { response })], asapScheduler))
        )
    )
  ));

  putSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PUT_SUCCESS)),
    switchMap((action: fromSdr.PutResourceSuccessAction) => [new fromDialog.CloseDialogAction(), this.alert.putSuccessAlert(action)])
  ));

  putFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PUT_FAILURE)),
    map((action: fromSdr.PutResourceFailureAction) => this.alert.putFailureAlert(action.payload))
  ));

  patch = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PATCH)),
    switchMap((action: fromSdr.PatchResourceAction) =>
      this.repos
        .get(action.name)
        .patch(action.payload.resource)
        .pipe(
          map((resource: SdrResource) => new fromSdr.PatchResourceSuccessAction(action.name, { resource })),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.PatchResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  patchSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PATCH_SUCCESS)),
    switchMap((action: fromSdr.PatchResourceSuccessAction) => [new fromDialog.CloseDialogAction(), this.alert.patchSuccessAlert(action)])
  ));

  patchFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.PATCH_FAILURE)),
    map((action: fromSdr.PatchResourceFailureAction) => this.alert.patchFailureAlert(action.payload))
  ));

  delete = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.DELETE)),
    switchMap((action: fromSdr.DeleteResourceAction) =>
      this.repos
        .get(action.name)
        .delete(action.payload.id)
        .pipe(
          map(() => new fromSdr.DeleteResourceSuccessAction(action.name)),
          catchError((response) =>
            scheduled(
              [
                new fromSdr.DeleteResourceFailureAction(action.name, {
                  response,
                }),
              ],
              asapScheduler
            )
          )
        )
    )
  ));

  deleteSuccess = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.DELETE_SUCCESS)),
    switchMap((action: fromSdr.DeleteResourceSuccessAction) => [new fromDialog.CloseDialogAction(), this.alert.deleteSuccessAlert(action)])
  ));

  deleteFailure = createEffect(() => this.actions.pipe(
    ofType(...this.buildActions(fromSdr.SdrActionTypes.DELETE_FAILURE)),
    map((action: fromSdr.DeleteResourceFailureAction) => this.alert.deleteFailureAlert(action.payload))
  ));

  navigation = createEffect(() => this.actions.pipe(
    ofType(fromRouter.RouterActionTypes.CHANGED),
    withLatestFrom(this.store.pipe(select(selectRouterState))),
    map(([action, router]) => {
      let collection = router.state.data.collection;
      if (collection === undefined) {
        collection = router.state.queryParams.collection;
      }
      if (collection) {
        const request = createSdrRequest(router.state);
        if (router.state.url.startsWith('/directory') || router.state.url.startsWith('/discovery')) {
          this.store.dispatch(new fromSdr.SearchResourcesAction(collection, { request }));
        } else {
          this.store.dispatch(new fromSdr.PageResourcesAction(collection, { request }));
        }
      }
    })
  ), { dispatch: false });

  initViews = createEffect(() => defer(() => scheduled([
    new fromSdr.GetAllResourcesAction('dataAndAnalyticsViews'),
    new fromSdr.GetAllResourcesAction('directoryViews'),
    new fromSdr.GetAllResourcesAction('discoveryViews')
  ], asapScheduler)));

  private injectRepos(): void {
    const injector = Injector.create({
      providers: injectable,
      parent: this.injector,
    });
    for (const name in repos) {
      if (repos.hasOwnProperty(name)) {
        this.repos.set(name, injector.get<AbstractSdrRepo<SdrResource>>(repos[name]));
      }
    }
  }

  private buildActions(actionType: fromSdr.SdrActionTypes, exclude: string[] = []): string[] {
    const loadActions = [];
    for (const name in repos) {
      if (repos.hasOwnProperty(name) && exclude.indexOf(name) < 0) {
        loadActions.push(fromSdr.getSdrAction(actionType, name));
      }
    }
    return loadActions;
  }

  private waitForStompConnection(name: string): Observable<[string, boolean]> {
    return combineLatest([
      scheduled([name], asapScheduler),
      this.store.pipe(
        select(selectIsStompConnected),
        skipWhile((connected: boolean) => !connected),
        take(1)
      ),
    ]);
  }

  private subscribeToResourceQueue(name: string, stomp: StompState): void {
    if (!stomp.subscriptions.has(`/queue/${name}`)) {
      this.store.dispatch(
        new fromStomp.SubscribeAction({
          channel: `/queue/${name}`,
          handle: (frame: any) => {
            // TODO: conditionally reload all
            if (frame.command === 'MESSAGE') {
              console.log(frame);
            }
          },
        })
      );
    }
  }

  private searchSuccessHandler(results: {
    action: fromSdr.SearchResourcesSuccessAction,
    route: CustomRouterState,
    directory: SdrState<DirectoryView>,
    discovery: SdrState<DiscoveryView>
  }): void {
    const { action, route, directory, discovery } = results;
    if (route.queryParams.collection) {
      this.stats.collect(route.queryParams).toPromise().then((data: any) => {
        if (data) {
          // do nothing
        }
      }).catch((error: any) => {
        console.error(error);
      });

      // tslint:disable-next-line: no-string-literal
      const viewFacets: Facet[] = route.url.startsWith('/directory')
        ? directory.entities[route.params.view].facets
        : discovery.entities[route.params.view].facets;

      const sdrFacets: SdrFacet[] = action.payload.collection.facets;

      const menu: SidebarMenu = {
        sections: [],
      };

      const expanded = route.queryParams.expanded ? route.queryParams.expanded.split(',') : [];

      viewFacets
        .filter((viewFacet: Facet) => !viewFacet.hidden)
        .forEach((viewFacet: Facet) => {

          const sdrFacet = sdrFacets.find((sf: SdrFacet) => sf.field === viewFacet.field);

          if (sdrFacet) {
            const sidebarSection: SidebarSection = {
              title: viewFacet.name,
              items: [],
              expandable: viewFacet.expandable,
              collapsible: viewFacet.collapsible,
              collapsed: expanded.indexOf(encodeURIComponent(viewFacet.name)) < 0,
              useDialog: viewFacet.useDialog
            };

            const selectedFilterValues = [];

            menu.sections.push(sidebarSection);

            sdrFacet.entries.content
              .filter((facetEntry: SdrFacetEntry) => facetEntry.value.length > 0)
              .forEach((facetEntry: SdrFacetEntry) => {
                const requestFacet = route.queryParams.facets.split(',').find((rf: string) => rf === sdrFacet.field);

                let selected = false;

                let filterValue = viewFacet.type === FacetType.DATE_YEAR
                  ? buildDateYearFilterValue(facetEntry)
                  : viewFacet.type === FacetType.NUMBER_RANGE
                    ? buildNumberRangeFilterValue(viewFacet, facetEntry)
                    : facetEntry.value;

                if (requestFacet && route.queryParams[`${requestFacet}.filter`] !== undefined) {
                  selected = route.queryParams[`${requestFacet}.filter`].split(FILTER_VALUE_DELIMITER).indexOf(filterValue) >= 0;
                }

                const sidebarItem: SidebarItem = {
                  type: SidebarItemType.FACET,
                  label: getFacetFilterLabel(viewFacet, facetEntry),
                  facet: viewFacet,
                  parenthetical: facetEntry.count,
                  selected,
                  route: [],
                  queryParams: Object.assign({}, route.queryParams)
                };

                sidebarItem.queryParams.page = 1;

                if (selected) {
                  sidebarSection.collapsed = false;
                  if (sidebarItem.queryParams.filters && sidebarItem.queryParams.filters.indexOf(sdrFacet.field) >= 0) {
                    const queryParams: Params = Object.assign({}, sidebarItem.queryParams);
                    removeFilterFromQueryParams(queryParams, {
                      field: sdrFacet.field,
                      value: filterValue,
                      opKey: queryParams[`${sdrFacet.field}.opKey`],
                    });
                    sidebarItem.queryParams = queryParams;
                  }

                  selectedFilterValues.push(filterValue);
                } else {
                  if (sidebarItem.queryParams.filters) {
                    if (sidebarItem.queryParams.filters.indexOf(sdrFacet.field) < 0) {
                      sidebarItem.queryParams.filters += `,${sdrFacet.field}`;
                    }
                  } else {
                    sidebarItem.queryParams.filters = sdrFacet.field;
                  }

                  selectedFilterValues.forEach((selectedFilterValue: string) => {
                    filterValue += `${FILTER_VALUE_DELIMITER}${selectedFilterValue}`;
                  });

                  sidebarItem.queryParams[`${sdrFacet.field}.filter`] = filterValue;

                  sidebarItem.queryParams[`${sdrFacet.field}.opKey`] = (viewFacet.type === FacetType.DATE_YEAR || viewFacet.type === FacetType.NUMBER_RANGE)
                    ? OpKey.BETWEEN
                    : OpKey.EQUALS;
                }

                sidebarSection.items.push(sidebarItem);
              });

            if (sdrFacet.entries.page.totalPages > 1) {
              sidebarSection.items.push({
                type: SidebarItemType.ACTION,
                action: this.dialog.facetEntriesDialog(viewFacet.name, sdrFacet.field),
                label: this.translate.instant('SHARED.SIDEBAR.ACTION.MORE'),
                classes: 'font-weight-bold',
              });
            }
          }
        });

      if (action.payload.collection.page.totalElements === 0) {
        menu.sections.push({
          title: this.translate.instant('SHARED.SIDEBAR.INFO.NO_RESULTS_LABEL', {
            view: route.params.view,
          }),
          items: [
            {
              type: SidebarItemType.INFO,
              label: this.translate.instant('SHARED.SIDEBAR.INFO.NO_RESULTS_TEXT', {
                view: route.params.view,
                query: route.queryParams.query,
              }),
              route: [],
              queryParams: {},
            },
          ],
          expandable: true,
          collapsible: false,
          collapsed: false,
          useDialog: false
        });
      }

      this.store.dispatch(new fromSidebar.LoadSidebarAction({ menu }));
    }
  }

}
