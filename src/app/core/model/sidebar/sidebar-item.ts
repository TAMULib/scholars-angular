import { Params } from '@angular/router';
import { Action } from '@ngrx/store';

export enum SidebarItemType {
  FACET = 'FACET',
  RANGE_SLIDER = 'RANGE_SLIDER',
  ACTION = 'ACTION',
  INFO = 'INFO',
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
