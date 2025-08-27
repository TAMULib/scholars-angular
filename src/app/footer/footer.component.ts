import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { skipWhile } from 'rxjs/operators';

import { Footer } from '../core/model/theme/footer';
import { Role, User } from '../core/model/user';
import { DialogService } from '../core/service/dialog.service';
import { AppState } from '../core/store';
import { selectHasRole, selectIsAuthenticated, selectUser } from '../core/store/auth';
import { selectActiveThemeFooter } from '../core/store/theme';
import { RegistrationStep } from '../shared/dialog/registration/registration.component';

import * as fromAuth from '../core/store/auth/auth.actions';
import { APP_CONFIG, AppConfig } from '../app.config';

@Component({
  selector: 'scholars-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {

  public isAuthenticated: Observable<boolean>;

  public isSuperAdmin: Observable<boolean>;

  public user: Observable<User>;

  public footer: Observable<Footer>;

  constructor(
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig,
    private store: Store<AppState>,
    private dialog: DialogService
  ) {

  }

  ngOnInit() {
    this.isAuthenticated = this.store.pipe(select(selectIsAuthenticated));
    this.isSuperAdmin = this.store.pipe(select(selectHasRole(Role.ROLE_SUPER_ADMIN)));
    this.user = this.store.pipe(select(selectUser));
    this.footer = this.store.pipe(
      select(selectActiveThemeFooter),
      skipWhile((footer: Footer) => footer === undefined)
    );
  }

  public getSaml2Url(): string {
    return this.appConfig.saml2Url;
  }

  public openLoginDialog(): void {
    this.store.dispatch(this.dialog.loginDialog());
  }

  public openRegistrationDialog(): void {
    this.store.dispatch(
      this.dialog.registrationDialog(RegistrationStep.SUBMIT, {
        firstName: '',
        lastName: '',
        email: '',
      })
    );
  }

  public logout(): void {
    this.store.dispatch(new fromAuth.LogoutAction());
  }

}
