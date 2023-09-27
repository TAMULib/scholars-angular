import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';

import { SdrPage } from '../../core/model/sdr';
import { Role, User } from '../../core/model/user';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { selectAllResources, selectResourcesPage } from '../../core/store/sdr';

@Component({
  selector: 'scholars-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UsersComponent implements OnInit {

  public users: Observable<User[]>;

  public page: Observable<SdrPage>;

  constructor(private store: Store<AppState>, private dialog: DialogService) {}

  ngOnInit() {
    this.users = this.store.pipe(select(selectAllResources<User>('users')));
    this.page = this.store.pipe(select(selectResourcesPage<User>('users')));
  }

  public openUserEditDialog(user: User): void {
    this.store.dispatch(this.dialog.userEditDialog(user));
  }

  public getRoleValue(role: Role): string {
    return Role[role];
  }

}
