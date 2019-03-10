import { View } from './';

export enum Layout {
    LIST = 'LIST',
    GRID = 'GRID'
}

export enum FacetSort {
    COUNT = 'COUNT',
    INDEX = 'INDEX'
}

export interface Facet {
    readonly name: string;
    readonly field: string;
    readonly limit: number;
    readonly sort: FacetSort;
}

export interface Filter {
    readonly field: string;
    readonly value: string;
}

export interface CollectionView extends View {
    readonly collection: string;
    readonly layout: Layout;
    readonly template: string;
    readonly styles: string[];
    readonly facets: Facet[];
    readonly filters: Filter[];
}
