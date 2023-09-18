import { SdrResource } from '../sdr';

export interface SolrDocument extends SdrResource {
  readonly id: number | string;
  readonly type: string[];
  readonly name?: string;
  readonly class?: string;
}
