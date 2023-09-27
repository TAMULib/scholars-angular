import { View } from './';
import { ExportView } from './export-view';
import { FieldView } from './field-view';

export enum Side {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface DisplaySubsectionView extends FieldView {
  readonly pageSize: number;
  readonly template: string;
  templateFunction?: (individual: any) => string;
}

export interface DisplayTabSectionView extends FieldView {
  readonly hidden: boolean;
  readonly shared: boolean;
  readonly paginated: boolean;
  readonly pageSize: number;
  readonly template: string;
  templateFunction?: (individual: any) => string;
  readonly requiredFields: string[];
  readonly lazyReferences: string[];
  readonly subsections: DisplaySubsectionView[];
}

export interface DisplayTabView extends View {
  readonly hidden: boolean;
  readonly sections: DisplayTabSectionView[];
}

export interface DisplayView extends View {
  readonly types: string[];
  readonly mainContentTemplate: string;
  mainContentTemplateFunction?: (individual: any) => string;
  readonly leftScanTemplate: string;
  leftScanTemplateFunction?: (individual: any) => string;
  readonly rightScanTemplate: string;
  rightScanTemplateFunction?: (individual: any) => string;
  readonly asideTemplate: string;
  asideTemplateFunction?: (individual: any) => string;
  readonly asideLocation: Side;
  readonly exportViews: ExportView[];
  readonly metaTemplates: any;
  metaTemplateFunctions?: any;
  readonly tabs: DisplayTabView[];
}
