import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Store, select } from '@ngrx/store';

import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AppState } from '../core/store';

import { SdrRequest } from '../core/model/request';
import { CollectionView, DirectoryView } from '../core/model/view';
import { SolrDocument } from '../core/model/discovery';
import { SdrPage, SdrFacet } from '../core/model/sdr';

import { selectAllResources, selectResourcesPage, selectResourcesFacets, selectResourceById } from '../core/store/sdr';

import * as fromSdr from '../core/store/sdr/sdr.actions';

@Component({
    selector: 'scholars-directory',
    templateUrl: 'directory.component.html',
    styleUrls: ['directory.component.scss']
})
export class DirectoryComponent implements OnDestroy, OnInit {

    public view: Observable<CollectionView>;

    public documents: Observable<SolrDocument[]>;

    public page: Observable<SdrPage>;

    public facets: Observable<SdrFacet[]>;

    private subscriptions: Subscription[];

    constructor(
        private store: Store<AppState>,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.subscriptions = [];
    }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => {
            subscription.unsubscribe();
        });
    }

    ngOnInit() {
        this.subscriptions.push(this.route.params.subscribe((params) => {
            if (params.name) {
                this.view = this.store.pipe(
                    select(selectResourceById('directoryViews', params.name)),
                    filter((view: CollectionView) => view !== undefined)
                );
                this.subscriptions.push(this.view.subscribe((view: CollectionView) => {
                    this.documents = this.store.pipe(select(selectAllResources<SolrDocument>(view.collection)));
                    this.page = this.store.pipe(select(selectResourcesPage<SolrDocument>(view.collection)));
                    this.facets = this.store.pipe(select(selectResourcesFacets<SolrDocument>(view.collection)));
                }));
            }
        }));
    }

    public reset(view: DirectoryView): void {
        const urlTree = this.router.createUrlTree([`/directory/${view.name}`], {
            queryParams: { index: undefined },
            queryParamsHandling: 'merge',
            preserveFragment: true
        });
        this.router.navigateByUrl(urlTree);
    }

    public gotoIndex(view: DirectoryView, option: string): void {
        const urlTree = this.router.createUrlTree([`/directory/${view.name}`], {
            queryParams: { index: `${view.index.field},${option}` },
            queryParamsHandling: 'merge',
            preserveFragment: true
        });
        this.router.navigateByUrl(urlTree);
    }

    public onPageChange(request: SdrRequest): void {
        this.store.dispatch(new fromSdr.SearchResourcesAction(request.collection, { request }));
    }

}
