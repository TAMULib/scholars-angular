import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { select, Store } from '@ngrx/store';

import { filter, map, Observable, take, tap } from 'rxjs';
import { Individual } from '../../core/model/discovery';
import { IndividualRepo } from '../../core/model/discovery/repo/individual.repo';
import { Facetable } from '../../core/model/request';
import { DataAndAnalyticsView, DisplayView, OpKey } from '../../core/model/view';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { selectRouterState } from '../../core/store/router';
import { CustomRouterState } from '../../core/store/router/router.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { createSdrRequest } from '../../shared/utilities/discovery.utility';
import { SdrCollection, SdrFacet } from 'src/app/core/model/sdr';

@Component({
  selector: 'scholars-frequency-graph',
  templateUrl: './frequency-graph.component.html',
  styleUrls: ['./frequency-graph.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrequencyGraphComponent implements OnInit, OnChanges {

  @Input()
  public organization: Individual;

  @Input()
  public displayView: DisplayView;

  @Input()
  public dataAndAnalyticsView: DataAndAnalyticsView;

  @Input()
  public filters: any[];

  @Input()
  public defaultId: string;

  @Output()
  public labelEvent: EventEmitter<string>;

  public routerState: Observable<CustomRouterState>;

  public facets: Observable<SdrFacet[]>;

  public page = 1;
  public pageSize = 10;

  public selectedFacet;

  constructor(
    @Inject(PLATFORM_ID) readonly platformId: string,
    readonly store: Store<AppState>,
    readonly dialog: DialogService,
    readonly individualRepo: IndividualRepo
  ) {
    this.labelEvent = new EventEmitter<string>();
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.routerState = this.store.pipe(
      select(selectRouterState),
      filter((router: any) => router !== undefined),
      map((router: any) => router.state)
    );

    this.loadFacets(this.organization);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { organization } = changes;

    if (organization?.currentValue) {
      this.loadFacets(organization.currentValue);
    }
  }

  loadFacets(organization): void {
    if (this.routerState) {
      this.routerState.pipe(take(1)).subscribe((routerState: CustomRouterState) => {
        const originalSdrRequest = createSdrRequest(routerState);
        const sdrRequest = Object.assign(originalSdrRequest);

        sdrRequest.filters.push({
          field: 'authorOrganization',
          opKey: OpKey.EQUALS,
          value: organization.name
        });

        this.facets = this.individualRepo.search(sdrRequest)
          .pipe(
            tap((collection: SdrCollection) => {
              if (collection?.facets.length > 0) {
                this.selectedFacet = collection?.facets[0];
              }
            }),
            map((collection: SdrCollection) => collection.facets)
          );
      });
    }
  }

  selectViewAll(facets): void {
    const content = facets
      .flatMap(facet => facet.entries.content)
      .sort((a, b) => b.count - a.count);
    const page = {};

    this.selectedFacet = {
      field: 'View All',
      entries: {
        content,
        page
      }
    }
  }

}
