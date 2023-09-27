import { FieldView } from "./field-view";
import { View } from "./view";

export interface ExportFieldView extends FieldView {
  limit: number;
}

export interface ExportView extends View {
  readonly contentTemplate: string;
  contentTemplateFunction?: (individual: any) => string;
  readonly headerTemplate: string;
  headerTemplateFunction?: (individual: any) => string;
  readonly multipleReference: ExportFieldView;
  readonly lazyReferences: ExportFieldView[];
}
