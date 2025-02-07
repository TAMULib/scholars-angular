import { SdrFacetEntry } from './sdr-facet-entry';
import { SdrPage } from './sdr-page';
import { SdrFacetPivot } from './sdr-facet-pivot';

export interface SdrFacet {
  readonly field: string;
  readonly entries: {
    content: SdrFacetEntry[];
    page: SdrPage;
  };
  readonly pivot?: Map<string, SdrFacetPivot[]>;
}
