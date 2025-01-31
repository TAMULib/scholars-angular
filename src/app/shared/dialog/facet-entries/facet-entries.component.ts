import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, queueScheduler, scheduled } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';

import { DialogButtonType, DialogControl } from '../../../core/model/dialog';
import { IndividualRepo } from '../../../core/model/discovery/repo/individual.repo';
import { Facetable } from '../../../core/model/request';
import { SdrCollection, SdrFacet, SdrFacetEntry } from '../../../core/model/sdr';
import { CollectionView, Facet, FacetType, OpKey } from '../../../core/model/view';
import { AppState } from '../../../core/store';
import { selectRouterQueryParams, selectRouterState } from '../../../core/store/router';
import { CustomRouterState } from '../../../core/store/router/router.reducer';
import { selectCollectionViewByName } from '../../../core/store/sdr';

import { FILTER_VALUE_DELIMITER, buildDateYearFilterValue, buildNumberRangeFilterValue, createSdrRequest, getFacetEntryLabel, hasFilter } from '../../utilities/discovery.utility';

import * as fromDialog from '../../../core/store/dialog/dialog.actions';

@Component({
  selector: 'scholars-facet-entries',
  templateUrl: './facet-entries.component.html',
  styleUrls: ['./facet-entries.component.scss'],
})
export class FacetEntriesComponent implements OnDestroy, OnInit {

  @Input()
  public name: string;

  @Input()
  public field: string;

  @Input()
  public multiselect: boolean;

  @Input()
  public page;

  @Input()
  public pageSize;

  public queryParams: Observable<Params>;

  public routerState: Observable<CustomRouterState>;

  public collectionView: Observable<CollectionView>;

  public facet: Observable<Facet>;

  public sdrFacet: Observable<SdrFacet>;

  public routerLink = [];

  public form: UntypedFormGroup;

  public dialog: DialogControl;

  private selections: BehaviorSubject<SdrFacetEntry[]>;

  private selectedQueryParams: BehaviorSubject<Params>;

  private subscriptions: Subscription[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private store: Store<AppState>,
    private translate: TranslateService,
    private individualRepo: IndividualRepo
  ) {
    this.selections = new BehaviorSubject<SdrFacetEntry[]>([]);
    this.selectedQueryParams = new BehaviorSubject<Params>({});
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit() {
    this.routerState = this.store.pipe(
      select(selectRouterState),
      filter((router: any) => router !== undefined),
      map((router: any) => router.state)
    );

    const formGroup = {
      filter: new UntypedFormControl()
    };

    this.form = this.formBuilder.group(formGroup);

    this.queryParams = this.store.pipe(select(selectRouterQueryParams));

    this.subscriptions.push(
      this.routerState.subscribe((routerState: CustomRouterState) => {

        const submit = {
          type: DialogButtonType.OUTLINE_PRIMARY,
          label: this.translate.get('SHARED.DIALOG.FACET_ENTRIES.SUBMIT'),
          action: () => {

            const filters = [
              ...routerState.queryParams.filters.split(',').filter((field: string) => this.field !== field),
              this.field
            ].join(',');

            const queryParams = {
              ...routerState.queryParams,
              ...this.selectedQueryParams.value,
              filters
            };

            this.router.navigate([], {
              relativeTo: this.route,
              queryParams,
              queryParamsHandling: 'merge'
            });

          },
          disabled: () => this.selections.asObservable().pipe(map((selections: SdrFacetEntry[]) => selections.length === 0)),
        };

        this.dialog = {
          title: scheduled([this.name], queueScheduler),
          close: {
            type: DialogButtonType.OUTLINE_WARNING,
            label: this.translate.get('SHARED.DIALOG.FACET_ENTRIES.CANCEL'),
            action: () => {
              this.subscriptions.push(
                this.form.controls.filter.valueChanges.pipe(
                  distinctUntilChanged()
                ).subscribe(() => {
                  setTimeout(() => {
                    this.store.dispatch(new fromDialog.CloseDialogAction());
                  }, 500);
                })
              );
              this.form.controls.filter.setValue('');
            },
            disabled: () => scheduled([false], queueScheduler),
          },
          submit: this.multiselect ? submit : undefined
        };

        const collectionViewType = routerState.url.startsWith('/directory')
          ? 'directoryViews'
          : routerState.url.startsWith('/discovery')
            ? 'discoveryViews'
            : 'dataAndAnalyticsViews';

        this.collectionView = this.store.pipe(select(selectCollectionViewByName(collectionViewType, routerState.params.view)));

        this.facet = this.store.pipe(
          select(selectCollectionViewByName(collectionViewType, routerState.params.view)),
          map((view: CollectionView) => view.facets.find((facet: Facet) => facet.name === this.name)),
          tap((facet: Facet) => {

            const originalSdrRequest = createSdrRequest(routerState);

            const sdrRequest = Object.assign(originalSdrRequest, {
              page: {
                number: 1,
                size: 1,
                sort: originalSdrRequest.page.sort
              },
              facets: originalSdrRequest.facets.filter((f: Facetable) => f.field === facet.field).map((f: Facetable) => {
                f.pageNumber = 1;
                f.pageSize = 2147483647;
                return f;
              }),
              highlight: {},
              query: Object.assign(originalSdrRequest.query, {
                fields: 'class'
              })
            });

            // NOTE: isolating request for facets without going through the stores, leaving facets in store intact
            this.sdrFacet = this.individualRepo.search(sdrRequest).pipe(
              map((collection: SdrCollection) => collection.facets[0]),
              filter((sdrFacet: SdrFacet) => !!sdrFacet),
              tap((sdrFacet: SdrFacet) => {
                const content = Object.assign([], sdrFacet.entries.content);
                let lastTerm = '';
                this.subscriptions.push(
                  this.form.controls.filter.valueChanges.pipe(
                    debounceTime(500),
                    distinctUntilChanged()
                  ).subscribe((term: string) => {
                    const currentContent = lastTerm.length > term.length ? content : sdrFacet.entries.content;
                    lastTerm = term = term.toLowerCase();
                    sdrFacet.entries.content = currentContent.filter((entry) => {
                      const index = entry.value.toLowerCase().indexOf(term);
                      const hit = index >= 0;
                      if (hit) {
                        const before = entry.value.substring(0, index);
                        const match = entry.value.substring(index, index + term.length);
                        const after = entry.value.substring(index + term.length);
                        entry.valueHtml = `${before}<span style="background: #E3D67F">${match}</span>${after}`;
                      } else {
                        entry.valueHtml = entry.value;
                      }
                      return hit;
                    });
                  }));
              })
            );

          })
        );
      })
    );

    this.subscriptions.push(
      this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
        this.store.dispatch(new fromDialog.CloseDialogAction());
      })
    );
  }

  public getSelected(entry: SdrFacetEntry): number {
    return this.selections.value.indexOf(entry);
  }

  public isSelected(entry: SdrFacetEntry): boolean {
    return this.getSelected(entry) >= 0;
  }

  public onSelectionChanged(facet: Facet, entry: SdrFacetEntry): void {
    const selected = this.getSelected(entry);
    const selections = [...this.selections.value];
    if (selected >= 0) {
      selections.splice(selected, 1);
    } else {
      selections.push(entry);
    }
    this.selections.next(selections);

    const queryParams: Params = {};
    queryParams[`${this.field}.filter`] = this.selections.value.map((entry: SdrFacetEntry) => this.getQueryParamsForFacetEntry(facet, entry)[`${this.field}.filter`]).join(FILTER_VALUE_DELIMITER);
    queryParams[`${this.field}.opKey`] = facet.opKey;
    this.selectedQueryParams.next(queryParams);
  }

  public getFacetRangeValue(facet: Facet, entry: SdrFacetEntry): string {
    return getFacetEntryLabel(facet, entry);
  }

  public getStringValue(entry: SdrFacetEntry): string {
    return entry.valueHtml ? entry.valueHtml : entry.value;
  }

  public getQueryParams(params: Params, facet: Facet, entry: SdrFacetEntry): Params {
    const queryParams: Params = {
      ...params,
      ...this.getQueryParamsForFacetEntry(facet, entry)
    };
    queryParams[`${this.field}.pageNumber`] = 1;
    if (queryParams.filters && queryParams.filters.length > 0) {
      if (queryParams.filters.indexOf(this.field) < 0) {
        queryParams.filters += `,${facet.field}`;
      }
    } else {
      queryParams.filters = facet.field;
    }
    return queryParams;
  }

  private getQueryParamsForFacetEntry(facet: Facet, entry: SdrFacetEntry): Params {
    const queryParams: Params = { };
    switch (facet.type) {
      case FacetType.DATE_YEAR:
        queryParams[`${this.field}.filter`] = buildDateYearFilterValue(entry);
        queryParams[`${this.field}.opKey`] = OpKey.BETWEEN;
        break;
      case FacetType.NUMBER_RANGE:
        queryParams[`${this.field}.filter`] = buildNumberRangeFilterValue(facet, entry);
        queryParams[`${this.field}.opKey`] = OpKey.BETWEEN;
        break;
      default:
        queryParams[`${this.field}.filter`] = entry.value;
        queryParams[`${this.field}.opKey`] = OpKey.EQUALS;
        break;
    }

    return queryParams;
  }

}
