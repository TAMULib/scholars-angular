import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { Individual } from '../../core/model/discovery';
import { DisplayTabSectionView, DisplayTabView, DisplayView } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectDisplayViewByTypes, selectResourceById } from '../../core/store/sdr';
import { sectionsToShow } from '../display.component';

@Component({
  selector: 'scholars-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
})
export class TabComponent implements OnDestroy, OnInit {

  public tab: Observable<DisplayTabView>;

  public individual: Observable<Individual>;

  public display: string;

  private subscriptions: Subscription[];

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {
    this.subscriptions = [];
  }

  ngOnInit() {
    this.subscriptions.push(
      combineLatest([this.route.parent.params, this.route.params]).subscribe((params: Params[]) => {
        if (params[0].id && params[1].view && params[1].tab) {
          this.individual = this.store.pipe(select(selectResourceById('individual', params[0].id)));

          // listen to individual changes to get updated display view
          this.tab = this.store.pipe(
            select(selectResourceById('individual', params[0].id)),
            filter((individual: Individual) => individual !== undefined),
            switchMap((individual: Individual) => {

              // map tab from latest display view for individual type
              return this.store.pipe(
                select(selectDisplayViewByTypes(individual.type)),
                filter((displayView: DisplayView) => displayView !== undefined),
                map((displayView: DisplayView) => {
                  let tab: DisplayTabView;
                  for (const i in displayView.tabs) {
                    if (displayView.tabs.hasOwnProperty(i)) {
                      if (displayView.tabs[i].name === params[1].tab) {
                        tab = displayView.tabs[i];
                        break;
                      } else if (displayView.tabs[i].name === 'View All') {
                        tab = displayView.tabs[i];
                      }
                    }
                  }
                  return tab;
                })
              );
            })
          );

          this.display = params[1].view;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  public getSectionsToShow(tab: DisplayTabView, individual: Individual): DisplayTabSectionView[] {
    return sectionsToShow(tab.sections, individual);
  }

}
