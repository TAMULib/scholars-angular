import { FieldView } from "./field-view";
import { View } from "./view";

export interface ExportFieldView extends FieldView {
  limit: number;
}

export interface ExportView extends View {
  readonly contentTemplate: string;
  contentTemplateFunction?: (document: any) => string;
  readonly headerTemplate: string;
  headerTemplateFunction?: (document: any) => string;
  readonly multipleReference: ExportFieldView;
  readonly lazyReferences: ExportFieldView[];
}
