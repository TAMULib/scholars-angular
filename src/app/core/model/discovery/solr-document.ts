import { SdrResource } from '../sdr';

export interface SolrDocument extends SdrResource {
  readonly id: string;
  readonly type: string[];
  readonly class?: string;
  readonly name?: string;
}
