export interface SdrFacetPivot {
  readonly field: string;
  readonly value: string;
  readonly count: number;
  readonly pivot?: SdrFacetPivot[];
}
