import { Params } from '@angular/router';
import { Action } from '@ngrx/store';

export enum SidebarItemType {
  ACTION = 'ACTION',
  FACET = 'FACET',
  INFO = 'INFO',
  LINK = 'LINK',
  NUMBER_RANGE = 'NUMBER_RANGE',
}

export interface SidebarItem {
  type: SidebarItemType;
  label: string;
  facet?: any;
  route?: string[];
  queryParams?: Params;
  action?: Action;
  selected?: boolean;
  parenthetical?: number;
  rangeOptions?: any;
  rangeValues?: any;
  classes?: string;
}
