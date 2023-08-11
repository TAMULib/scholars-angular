import { SidebarItem } from './';

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
  expandable: boolean;
  collapsible: boolean;
  collapsed: boolean;
  useDialog: boolean;
  classes?: string;
}
