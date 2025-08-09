import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { asapScheduler, scheduled } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { AppState } from '../';
import { RegistrationStep } from '../../../shared/dialog/registration/registration.component';
import { LoginRequest, RegistrationRequest } from '../../model/request';
import { User } from '../../model/user';
import { AlertService } from '../../service/alert.service';
import { AuthService } from '../../service/auth.service';
import { DialogService } from '../../service/dialog.service';
import { selectRouterUrl } from '../router';
import { selectLoginRedirect } from './';

import * as fromDialog from '../dialog/dialog.actions';
import * as fromRouter from '../router/router.actions';
import * as fromSdr from '../sdr/sdr.actions';
import * as fromAuth from './auth.actions';

@Injectable()
export class AuthEffects implements OnInitEffects {

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private actions: Actions,
    private store: Store<AppState>,
    private alert: AlertService,
    private authService: AuthService,
    private dialog: DialogService
  ) {

  }

  login = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.LOGIN),
    map((action: fromAuth.LoginAction) => action.payload),
    switchMap((payload: { login: LoginRequest }) =>
      this.authService.login(payload.login).pipe(
        map((user: User) => new fromAuth.LoginSuccessAction({ user })),
        catchError((response) => scheduled([new fromAuth.LoginFailureAction({ response })], asapScheduler))
      )
    )
  ));

  loginSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.LOGIN_SUCCESS),
    map((action: fromAuth.LoginSuccessAction) => action.payload),
    withLatestFrom(this.store.select(selectLoginRedirect)),
    switchMap(([payload, url]) => {
      const actions: Action[] = [
        new fromAuth.GetUserSuccessAction({ user: payload.user }),
        new fromDialog.CloseDialogAction(),
        this.alert.loginSuccessAlert()
      ];
      if (url !== undefined) {
        actions.push(new fromAuth.UnsetLoginRedirectAction());
        actions.push(new fromRouter.Link({ url }));
      }

      return actions;
    })
  ));

  loginFailure = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.LOGIN_FAILURE),
    map((action: fromAuth.LoginFailureAction) => this.alert.loginFailureAlert(action.payload))
  ));

  submitRegistration = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.SUBMIT_REGISTRATION),
    map((action: fromAuth.SubmitRegistrationAction) => action.payload),
    switchMap((payload: { registration: RegistrationRequest }) =>
      this.authService.submitRegistration(payload.registration).pipe(
        map((registration: RegistrationRequest) => new fromAuth.SubmitRegistrationSuccessAction({ registration })),
        catchError((response) => scheduled([new fromAuth.SubmitRegistrationFailureAction({ response })], asapScheduler))
      )
    )
  ));

  submitRegistrationSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.SUBMIT_REGISTRATION_SUCCESS),
    map((action: fromAuth.SubmitRegistrationSuccessAction) => action.payload),
    map((payload: { registration: RegistrationRequest }) => payload.registration),
    switchMap(() => [new fromDialog.CloseDialogAction(), this.alert.submitRegistrationSuccessAlert()])
  ));

  submitRegistrationFailure = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.SUBMIT_REGISTRATION_FAILURE),
    map((action: fromAuth.SubmitRegistrationFailureAction) => this.alert.submitRegistrationFailureAlert(action.payload))
  ));

  confirmRegistration = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.CONFIRM_REGISTRATION),
    map((action: fromAuth.ConfirmRegistrationAction) => action.payload),
    switchMap((payload: { key: string }) =>
      this.authService.confirmRegistration(payload.key).pipe(
        map((registration: RegistrationRequest) => new fromAuth.ConfirmRegistrationSuccessAction({ registration })),
        catchError((response) => scheduled([new fromAuth.ConfirmRegistrationFailureAction({ response })], asapScheduler))
      )
    )
  ));

  confirmRegistrationSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.CONFIRM_REGISTRATION_SUCCESS),
    map((action: fromAuth.ConfirmRegistrationSuccessAction) => action.payload),
    map((payload: { registration: RegistrationRequest }) => payload.registration),
    switchMap((registration: RegistrationRequest) => {
      return [new fromDialog.CloseDialogAction(), this.dialog.registrationDialog(RegistrationStep.COMPLETE, registration), this.alert.confirmRegistrationSuccessAlert()];
    })
  ));

  confirmRegistrationFailure = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.CONFIRM_REGISTRATION_FAILURE),
    map((action: fromAuth.ConfirmRegistrationFailureAction) => action.payload),
    switchMap((payload: { response: any }) => [new fromRouter.Link({ url: '/' }), this.alert.confirmRegistrationFailureAlert(payload)])
  ));

  completeRegistration = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.COMPLETE_REGISTRATION),
    map((action: fromAuth.CompleteRegistrationAction) => action.payload),
    switchMap((payload: { key: string; registration: RegistrationRequest }) =>
      this.authService.completeRegistration(payload.key, payload.registration).pipe(
        map((user: User) => new fromAuth.CompleteRegistrationSuccessAction({ user })),
        catchError((response) => scheduled([new fromAuth.CompleteRegistrationFailureAction({ response })], asapScheduler))
      )
    )
  ));

  completeRegistrationSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.COMPLETE_REGISTRATION_SUCCESS),
    map((action: fromAuth.CompleteRegistrationSuccessAction) => action.payload),
    switchMap(() => [
      new fromDialog.CloseDialogAction(),
      new fromRouter.Link({ url: '/' }),
      this.alert.completeRegistrationSuccessAlert()
    ])
  ));

  completeRegistrationFailure = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.COMPLETE_REGISTRATION_FAILURE),
    map((action: fromAuth.CompleteRegistrationFailureAction) => this.alert.completeRegistrationFailureAlert(action.payload))
  ));

  logout = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.LOGOUT),
    map((action: fromAuth.LoginAction) => action.payload),
    switchMap((payload: any) =>
      this.authService.logout().pipe(
        map((response: any) => new fromAuth.LogoutSuccessAction({ message: response.message, ...payload })),
        catchError((response) => scheduled([new fromAuth.LogoutFailureAction({ response })], asapScheduler))
      )
    )
  ));

  logoutSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.LOGOUT_SUCCESS),
    map((action: fromAuth.LogoutSuccessAction) => action.payload),
    withLatestFrom(this.store.select(selectRouterUrl)),
    switchMap(([payload, url]: any) => {

      const logoutActions: Action[] = [
        new fromSdr.ClearResourcesAction('Theme'),
        new fromSdr.ClearResourcesAction('User'),
        // other authorized views and states that need to clear
        //
        new fromRouter.Link({ url: '/' })
      ];

      // TODO: determine if reauthenticate required, remove if alternative available for session timeout and require reauthenticating
      // if (payload.reauthenticate) {
      //   logoutActions.push(this.dialog.loginDialog());
      //   logoutActions.push(new fromAuth.SetLoginRedirectAction({ url }));
      //   logoutActions.push(this.alert.unauthorizedAlert());
      // }

      return logoutActions;
    })
  ));

  getUser = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.GET_USER),
    switchMap(() =>
      this.authService.getUser().pipe(
        map((user: User) => new fromAuth.GetUserSuccessAction({ user })),
        catchError((response) => scheduled([new fromAuth.GetUserFailureAction({ response })], asapScheduler))
      )
    )
  ));

  getUserSuccess = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.GET_USER_SUCCESS),
    withLatestFrom(this.store.select(selectRouterUrl)),
    map(([action, url]) => {
      if (isPlatformBrowser(this.platformId)) {
        // TODO: cleanup any unused actions/effects/reducers and determine if any UI/UX behavior desired here

        // this.store.dispatch(this.dialog.loginDialog());
        // this.store.dispatch(new fromAuth.SetLoginRedirectAction({ url }));
        // this.store.dispatch(this.alert.unauthorizedAlert());
      }
    })
  ), { dispatch: false });

  getUserFailure = createEffect(() => this.actions.pipe(
    ofType(fromAuth.AuthActionTypes.GET_USER_FAILURE),
    withLatestFrom(this.store.select(selectRouterUrl)),
    map(([action, url]) => {
      if (isPlatformBrowser(this.platformId)) {
        // TODO: cleanup any unused actions/effects/reducers and determine if any UI/UX behavior desired here

        // this.store.dispatch(this.dialog.loginDialog());
        // this.store.dispatch(new fromAuth.SetLoginRedirectAction({ url }));
        // this.store.dispatch(this.alert.unauthorizedAlert());
      }
    })
  ), { dispatch: false });

  ngrxOnInitEffects(): Action {
    return new fromAuth.GetUserAction();
  }

}
