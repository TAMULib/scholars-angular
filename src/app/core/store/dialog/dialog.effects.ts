import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';

import { AppState } from '../';
import { AlertLocation } from '../../model/alert';
import { Dialog } from '../../model/dialog';
import { selectAlertsByLocation } from '../alert';

import * as fromAlert from '../alert/alert.actions';
import * as fromDialog from './dialog.actions';

@Injectable()
export class DialogEffects {

  constructor(private actions: Actions, private store: Store<AppState>, private modalService: NgbModal) {

  }

  openDialog = createEffect(() => this.actions.pipe(
    ofType(fromDialog.DialogActionTypes.OPEN_DIALOG),
    map((action: fromDialog.OpenDialogAction) => action.payload),
    map((payload: { dialog: Dialog }) => payload.dialog),
    map((dialog: Dialog) => {
      const modal = this.modalService.open(dialog.ref.component, dialog.options);
      for (const key in dialog.ref.inputs) {
        if (dialog.ref.inputs.hasOwnProperty(key)) {
          modal.componentInstance[key] = dialog.ref.inputs[key];
        }
      }
      return new fromDialog.DialogOpenedAction();
    })
  ));

  closeDialog = createEffect(() => this.actions.pipe(
    ofType(fromDialog.DialogActionTypes.CLOSE_DIALOG),
    map(() => {
      this.modalService.dismissAll();
      return new fromDialog.DialogClosedAction();
    })
  ));

  dismissDialogAlerts = createEffect(() => this.actions.pipe(
    ofType(fromDialog.DialogActionTypes.DIALOG_CLOSED),
    withLatestFrom(this.store.select(selectAlertsByLocation(AlertLocation.DIALOG))),
    map(([action, alerts]) => {
      alerts.forEach((alert) => {
        this.store.dispatch(new fromAlert.DismissAlertAction({ alert }));
      });
    })
  ), { dispatch: false });

}
