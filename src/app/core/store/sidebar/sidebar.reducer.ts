import { SidebarItem, SidebarMenu } from '../../model/sidebar';
import { SidebarActions, SidebarActionTypes } from './sidebar.actions';

export type SidebarState = Readonly<{
  menu: SidebarMenu;
}>;

export const initialState: SidebarState = {
  menu: {
    sections: [],
  },
};

export function reducer(state = initialState, action: SidebarActions): SidebarState {
  switch (action.type) {
    case SidebarActionTypes.LOAD_SIDEBAR:
      return {
        ...state,
        menu: action.payload.menu,
      };
    case SidebarActionTypes.UNLOAD_SIDEBAR:
      return {
        ...state,
        menu: {
          sections: [],
        },
      };
    case SidebarActionTypes.TOGGLE_COLLAPSIBLE_SECTION: {
      const sections = [...state.menu.sections];
      const section = sections[action.payload.sectionIndex];

      if (section.collapsed && section.expandable) {
        section.collapsed = false;
      } else if (!section.collapsed && section.collapsible) {
        section.collapsed = true;
      }

      return {
        ...state,
        menu: {
          sections
        }
      };
    }
    case SidebarActionTypes.ADD_SECTION_ITEM: {
      const sections = [...state.menu.sections];
      const section = sections[action.payload.sectionIndex];

      section.items.push(action.payload.sectionItem);

      return {
        ...state,
        menu: {
          sections
        }
      };
    }
    case SidebarActionTypes.REMOVE_SECTION_ITEM: {
      const sections = [...state.menu.sections];
      const section = sections[action.payload.sectionIndex];

      const index = section.items.map((item: SidebarItem) => item.label).indexOf(action.payload.itemLabel);

      if (index >= 0) {
        section.items.splice(index, 1);
      }

      return {
        ...state,
        menu: {
          sections
        }
      };
    }
    default:
      return state;
  }
}

export const getMenu = (state: SidebarState) => state.menu;
export const hasMenu = (state: SidebarState) => state.menu.sections.length > 0;
