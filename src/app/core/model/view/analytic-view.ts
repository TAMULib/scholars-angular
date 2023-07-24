import { CollectionView } from '.';

export enum ContainerType {
    ACADEMIC_AGE_GROUP = 'ACADEMIC_AGE_GROUP',
    QUANTITY_DISTRIBUTION = 'QUANTITY_DISTRIBUTION',
    SUMMARY_PROFILE_EXPORT = 'SUMMARY_PROFILE_EXPORT'
}

export interface AnalyticView extends CollectionView {
    type: ContainerType;
}
