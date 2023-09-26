import { Action } from '@ngrx/store';
import { SidebarItem, SidebarMenu } from '../../model/sidebar';

export enum SidebarActionTypes {
  LOAD_SIDEBAR = '[Sidebar] load',
  UNLOAD_SIDEBAR = '[Sidebar] unload',
  TOGGLE_COLLAPSIBLE_SECTION = '[Sidebar] toggle collapsible section',
  ADD_SECTION_ITEM = '[Sidebar] add section item',
  REMOVE_SECTION_ITEM = '[Sidebar] remove section item',
}

export class LoadSidebarAction implements Action {
  readonly type = SidebarActionTypes.LOAD_SIDEBAR;
  constructor(public payload: { menu: SidebarMenu }) { }
}

export class UnloadSidebarAction implements Action {
  readonly type = SidebarActionTypes.UNLOAD_SIDEBAR;
}

export class ToggleCollapsibleSectionAction implements Action {
  readonly type = SidebarActionTypes.TOGGLE_COLLAPSIBLE_SECTION;
  constructor(public payload: { sectionIndex: number }) { }
}

export class AddSectionItemAction implements Action {
  readonly type = SidebarActionTypes.ADD_SECTION_ITEM;
  constructor(public payload: { sectionIndex: number, sectionItem: SidebarItem }) { }
}

export class RemoveSectionAction implements Action {
  readonly type = SidebarActionTypes.REMOVE_SECTION_ITEM;
  constructor(public payload: { sectionIndex: number, itemLabel: string, itemField: string }) { }
}

export type SidebarActions =
  LoadSidebarAction |
  UnloadSidebarAction |
  ToggleCollapsibleSectionAction |
  AddSectionItemAction |
  RemoveSectionAction;
