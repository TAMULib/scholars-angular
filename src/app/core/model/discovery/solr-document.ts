import { SdrResource } from '../sdr';

export interface SolrDocument extends SdrResource {
  readonly id: number | string;
  readonly type: string[];
  readonly class?: string;
}
