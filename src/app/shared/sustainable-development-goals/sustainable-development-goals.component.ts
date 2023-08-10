import { Component } from '@angular/core';
import { Params } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { DiscoveryView, OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectDiscoveryViewByClass, selectResourcesCountByLabel } from '../../core/store/sdr';
import { goals } from '../utilities/un-sdg.utility';
import { getQueryParams } from '../utilities/view.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-sustainable-development-goals',
  templateUrl: 'sustainable-development-goals.component.html',
  styleUrls: ['sustainable-development-goals.component.scss']
})
export class SustainableDevelopmentGoalsComponent {

  get goals() {
    return goals;
  }

  public profileCount: Observable<number>;

  public profileDiscoveryView: Observable<DiscoveryView>;

  public researchCount: Observable<number>;

  public researchDiscoveryView: Observable<DiscoveryView>;

  constructor(private store: Store<AppState>) {
    goals.forEach(goal => {
      goal.icon = `assets/images/goals/${goal.value}.png`;
    });
  }

  click(event: any): void {
    event.target.dispatchEvent(new Event('click'));
  }

  hidden(goal: any): void {
    goal.icon = `assets/images/goals/${goal.value}.png`;
  }

  shown(goal: any): void {
    const profileTitle = `Profile ${goal.title}`;

    this.store.dispatch(
      new fromSdr.CountResourcesAction('individual', {
        label: profileTitle,
        request: this.buildRequest('Person', goal, 'selectedPublicationTag')
      })
    );

    this.profileCount = this.store.pipe(
      select(selectResourcesCountByLabel('individual', profileTitle)),
      tap(profileCount => goal.profileCount = profileCount)
    );

    this.profileDiscoveryView = this.store.pipe(
      select(selectDiscoveryViewByClass('Person')),
      filter((view: DiscoveryView) => view !== undefined)
    );

    const researchTitle = `Research ${goal.title}`;

    this.store.dispatch(
      new fromSdr.CountResourcesAction('individual', {
        label: researchTitle,
        request: this.buildRequest('Document', goal, 'tags')
      })
    );

    this.researchCount = this.store.pipe(
      select(selectResourcesCountByLabel('individual', researchTitle)),
      tap(researchCount => goal.researchCount = researchCount)
    );

    this.researchDiscoveryView = this.store.pipe(
      select(selectDiscoveryViewByClass('Document')),
      filter((view: DiscoveryView) => view !== undefined)
    );

    goal.icon = `assets/images/goals/${goal.value} Selected.png`;
  }

  getDiscoveryRouterLink(discoveryView: DiscoveryView): string[] {
    return [`/discovery/${discoveryView.name}`];
  }

  getDiscoveryQueryParams(discoveryView: DiscoveryView, goal: any, field: string): Params {
    const queryParams: Params = Object.assign({}, getQueryParams(discoveryView));
    queryParams.page = 1;
    queryParams[`${field}.filter`] = goal.value;
    queryParams[`${field}.opKey`] = 'EQUALS';
    queryParams.filters += `,${field}`;
    return queryParams;
  }

  trackByFn(index, item) {
    return index;
  }

  private buildRequest(classifier: string, goal: any, field: string): any {
    return {
      filters: [
        {
          field: 'class',
          value: classifier,
          opKey: OpKey.EQUALS,
        },
        {
          field,
          value: goal.value,
          opKey: OpKey.EQUALS,
        }
      ]
    };
  }

}
