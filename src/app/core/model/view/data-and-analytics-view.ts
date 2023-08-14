import { CollectionView } from '.';

export enum ContainerType {
  ACADEMIC_AGE_GROUP = 'ACADEMIC_AGE_GROUP',
  QUANTITY_DISTRIBUTION = 'QUANTITY_DISTRIBUTION',
  PROFILE_SUMMARIES_EXPORT = 'PROFILE_SUMMARIES_EXPORT'
}

export interface DataAndAnalyticsView extends CollectionView {
  readonly type: ContainerType;
}
