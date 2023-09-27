import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { queueScheduler, scheduled } from 'rxjs';

import { DialogButtonType, DialogControl } from '../../../core/model/dialog';
import { AppState } from '../../../core/store';

import * as fromDialog from '../../../core/store/dialog/dialog.actions';

@Component({
  selector: 'scholars-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  @Input() text: string;

  public dialog: DialogControl;

  constructor(private translate: TranslateService, private store: Store<AppState>) {}

  ngOnInit() {
    this.dialog = {
      title: this.translate.get('SHARED.DIALOG.NOTIFICATION.TITLE'),
      close: {
        type: DialogButtonType.OUTLINE_WARNING,
        label: this.translate.get('SHARED.DIALOG.NOTIFICATION.CANCEL'),
        action: () => this.store.dispatch(new fromDialog.CloseDialogAction()),
        disabled: () => scheduled([false], queueScheduler),
      },
    };
  }
}
