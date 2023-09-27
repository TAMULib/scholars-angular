import { NavigationExtras } from '@angular/router';
import { Action } from '@ngrx/store';

import { Filter } from '../../model/view';

export type RouterNavigation = Readonly<{
  path: any[];
  query?: object;
  extras?: NavigationExtras;
}>;

export enum RouterActionTypes {
  GO = '[Router] go',
  LINK = '[Router] link',
  BACK = '[Router] back',
  FORWARD = '[Router] forward',
  CHANGED = '[Router] changed',
  REMOVE_FILTER = '[Router] remove filter',
}

export class Go implements Action {
  readonly type = RouterActionTypes.GO;
  constructor(public payload: RouterNavigation) { }
}

export class Link implements Action {
  readonly type = RouterActionTypes.LINK;
  constructor(public payload: { url: string }) { }
}

export class Back implements Action {
  readonly type = RouterActionTypes.BACK;
}

export class Forward implements Action {
  readonly type = RouterActionTypes.FORWARD;
}

export class Changed implements Action {
  readonly type = RouterActionTypes.CHANGED;
}

export class RemoveFilter implements Action {
  readonly type = RouterActionTypes.REMOVE_FILTER;
  constructor(public payload: { filter: Filter }) { }
}

export type RouterActions =
  Go |
  Link |
  Back |
  Forward |
  Changed |
  RemoveFilter;
