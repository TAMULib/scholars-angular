import { SdrResource } from '../sdr';

export interface Individual extends SdrResource {
  readonly id: number | string;
  readonly type: string[];
  readonly name?: string;
  readonly class?: string;
}
