import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { MetaDefinition } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { BehaviorSubject, Observable, Subscription, firstValueFrom } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';

import { Individual } from '../core/model/discovery';
import { DiscoveryView, DisplayTabSectionView, DisplayTabView, DisplayView, Filter } from '../core/model/view';
import { DisplaySubsectionView, Side } from '../core/model/view/display-view';
import { AppState } from '../core/store';
import { selectWindowDimensions } from '../core/store/layout';
import { WindowDimensions } from '../core/store/layout/layout.reducer';
import { selectDiscoveryViewByClass, selectDisplayViewByTypes, selectResourceById, selectResourceIsDereferencing } from '../core/store/sdr';
import { fadeIn } from '../shared/utilities/animation.utility';
import { loadBadges } from '../shared/utilities/view.utility';

import * as fromMetadata from '../core/store/metadata/metadata.actions';
import * as fromSdr from '../core/store/sdr/sdr.actions';

const hasDataAfterFilter = (fltr: Filter, obj: any): boolean => {
  return Array.isArray(obj[fltr.field]) ? obj[fltr.field].indexOf(fltr.value) >= 0 : obj[fltr.field] === fltr.value;
};

const hasDataAfterFilters = (filters: Filter[], prop: any): boolean => {
  if (Array.isArray(prop)) {
    return prop.filter((obj) => {
      for (const fltr of filters) {
        if (hasDataAfterFilter(fltr, obj)) {
          return true;
        }
      }
      return false;
    }).length > 0;
  } else {
    for (const fltr of filters) {
      if (hasDataAfterFilter(fltr, prop)) {
        return true;
      }
    }
    return false;
  }
};

const hasDataAfterSubsectionFilters = (subsection: DisplaySubsectionView, prop: any): boolean => {
  return subsection.filters.length === 0 || hasDataAfterFilters(subsection.filters, prop);
};

const hasDataAfterSectionFilters = (section: DisplayTabSectionView, individual: Individual): boolean => {
  return (section.filters.length === 0 || hasDataAfterFilters(section.filters, individual[section.field])) && (section.subsections.length === 0 || section.subsections.filter((subsection: DisplaySubsectionView) => {
    return hasDataAfterSubsectionFilters(subsection, individual[subsection.field]);
  }).length > 0);
};

const hasRequiredFields = (requiredFields: string[], individual: Individual): boolean => {
  for (const requiredField of requiredFields) {
    if (individual[requiredField] === undefined) {
      return false;
    }
  }
  return true;
};

export const sectionsToShow = (sections: DisplayTabSectionView[], individual: Individual): DisplayTabSectionView[] => {
  return sections.filter((section: DisplayTabSectionView) => {
    return !section.hidden && hasRequiredFields(section.requiredFields.concat([section.field]), individual) && hasDataAfterSectionFilters(section, individual);
  });
};

@Component({
  selector: 'scholars-display',
  templateUrl: 'display.component.html',
  styleUrls: ['display.component.scss'],
  animations: [fadeIn],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayComponent implements OnDestroy, OnInit {

  public windowDimensions: Observable<WindowDimensions>;

  public displayView: Observable<DisplayView>;

  public discoveryView: Observable<DiscoveryView>;

  public individual: Observable<Individual>;

  public ready: BehaviorSubject<boolean>;

  private subscriptions: Subscription[];

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.subscriptions = [];
    this.ready = new BehaviorSubject<boolean>(false);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit() {
    this.windowDimensions = this.store.pipe(select(selectWindowDimensions));

    this.subscriptions.push(
      this.route.params.subscribe((params: Params) => {
        if (params.id) {
          this.ready.next(false);

          this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id: params.id }));

          // listen to individual changes
          this.individual = this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((individual: Individual) => individual !== undefined)
          );

          // on first defined individual, get discovery view
          this.discoveryView = this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((individual: Individual) => individual !== undefined),
            take(1),
            switchMap((individual: Individual) => {
              return this.store.pipe(
                select(selectDiscoveryViewByClass(individual.class)),
                filter((view: DiscoveryView) => view !== undefined)
              );
            })
          );

          // listen to individual changes, updating display view tabs
          this.displayView = this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((individual: Individual) => individual !== undefined),
            switchMap((individual: Individual) => {

              return this.store.pipe(
                select(selectDisplayViewByTypes(individual.type)),
                filter((displayView: DisplayView) => displayView !== undefined),
                tap((displayView: DisplayView) => {

                  setTimeout(() => {
                    this.store.dispatch(
                      new fromMetadata.AddMetadataTagsAction({
                        tags: this.buildDisplayMetaTags(displayView, individual),
                      })
                    );
                  });

                  const tabCount = displayView.tabs.length - 1;

                  if (displayView.tabs[tabCount].name === 'View All') {
                    displayView.tabs.splice(tabCount, 1);
                  }

                  const sections = new Map();
                  this.getTabsToShow(displayView.tabs, individual).forEach((tab: DisplayTabView) => {
                    this.getSectionsToShow(tab.sections, individual).forEach((section: DisplayTabSectionView) => {
                      sections.set(section.name, section);
                    });
                  });

                  const viewAllTab: DisplayTabView = {
                    name: 'View All',
                    hidden: false,
                    sections: Array.from(sections.values()),
                  };

                  displayView.tabs.push(viewAllTab);
                })
              );
            })
          );

          // subscribe to first defined individual to find display view
          firstValueFrom(this.store.pipe(
            select(selectResourceById('individual', params.id)),
            filter((individual: Individual) => individual !== undefined),
            take(1),
            switchMap((individual: Individual) => {

              this.store.dispatch(
                new fromSdr.FindByTypesInResourceAction('displayViews', {
                  types: individual.type,
                })
              );

              // subscribe to first defined display view to lazily fetch references
              return this.store.pipe(
                select(selectDisplayViewByTypes(individual.type)),
                filter((displayView: DisplayView) => displayView !== undefined),
                take(1),
                tap((displayView: DisplayView) => {

                  const dereference = (lazyReference: string): Promise<void> => {
                    return new Promise((resolve, reject) => {
                      this.store.dispatch(
                        new fromSdr.FetchLazyReferenceAction('individual', {
                          individual,
                          field: lazyReference,
                        })
                      );
                      this.subscriptions.push(
                        this.store.pipe(
                          select(selectResourceIsDereferencing('individual')),
                          filter((dereferencing: boolean) => !dereferencing)
                        ).subscribe(() => resolve())
                      );
                    });
                  };

                  const lazyReferences: string[] = [];

                  displayView.tabs
                    .filter((tab: DisplayTabView) => !tab.hidden)
                    .forEach((tab: DisplayTabView) => {
                      tab.sections
                        .filter((section: DisplayTabSectionView) => !section.hidden)
                        .forEach((section: DisplayTabSectionView) => {
                          section.lazyReferences
                            .filter((lr: string) => individual[lr] !== undefined && !lazyReferences.find((r) => r === lr))
                            .forEach((lazyReference: string) => {
                              lazyReferences.push(lazyReference);
                            });
                        });
                    });

                  // lazily fetch references sequentially
                  lazyReferences.reduce((previousPromise, nextlazyReference) => previousPromise.then(() => dereference(nextlazyReference)), Promise.resolve()).then(() => {
                    this.ready.next(true);

                    if (this.route.children.length === 0) {
                      this.router.navigate([displayView.name, 'View All'], {
                        relativeTo: this.route,
                        replaceUrl: true,
                      }).then(() => loadBadges(this.platformId));
                    } else {
                      loadBadges(this.platformId);
                    }

                  });

                })
              );
            })
          ));
        }
      })
    );
  }

  public getDisplayViewTabRoute(displayView: DisplayView, tab: DisplayTabView): string[] {
    return [displayView.name, tab.name];
  }

  public showMainContent(displayView: DisplayView): boolean {
    return displayView.mainContentTemplate && displayView.mainContentTemplate.length > 0;
  }

  public showLeftScan(displayView: DisplayView): boolean {
    return displayView.leftScanTemplate && displayView.leftScanTemplate.length > 0;
  }

  public showRightScan(displayView: DisplayView): boolean {
    return displayView.rightScanTemplate && displayView.rightScanTemplate.length > 0;
  }

  public showAsideLeft(displayView: DisplayView): boolean {
    return this.showAside(displayView) && displayView.asideLocation === Side.LEFT;
  }

  public showAsideRight(displayView: DisplayView): boolean {
    return this.showAside(displayView) && displayView.asideLocation === Side.RIGHT;
  }

  public showAside(displayView: DisplayView): boolean {
    return displayView.asideTemplate && displayView.asideTemplate.length > 0;
  }

  public getMainContentColSize(displayView: DisplayView): number {
    let colSize = 12;
    if (this.showLeftScan(displayView)) {
      colSize -= 3;
    }
    if (this.showRightScan(displayView)) {
      colSize -= 3;
    }
    return colSize;
  }

  public getLeftScanColSize(displayView: DisplayView): number {
    return 3;
  }

  public getRightScanColSize(displayView: DisplayView): number {
    return 3;
  }

  public getTabsToShow(tabs: DisplayTabView[], individual: Individual): DisplayTabView[] {
    return tabs.filter((tab: DisplayTabView) => !tab.hidden && this.getSectionsToShow(tab.sections, individual).length > 0);
  }

  public getSectionsToShow(sections: DisplayTabSectionView[], individual: Individual): DisplayTabSectionView[] {
    return sectionsToShow(sections, individual);
  }

  public isMobile(windowDimensions: WindowDimensions): boolean {
    return windowDimensions.width < 768;
  }

  private buildDisplayMetaTags(displayView: DisplayView, individual: Individual): MetaDefinition[] {
    const metaTags: MetaDefinition[] = [];
    for (const name in displayView.metaTemplateFunctions) {
      if (displayView.metaTemplateFunctions.hasOwnProperty(name)) {
        const metaTemplateFunction = displayView.metaTemplateFunctions[name];
        metaTags.push({
          name,
          content: metaTemplateFunction(individual).trim(),
        });
      }
    }
    return metaTags;
  }

}
