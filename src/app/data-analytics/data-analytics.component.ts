import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, tap, withLatestFrom } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../app.config';
import { SolrDocument } from '../core/model/discovery';
import { AnalyticView } from '../core/model/view';
import { AppState } from '../core/store';
import { selectRouterState } from '../core/store/router';
import { selectAllResources, selectResourceById } from '../core/store/sdr';
import { fadeIn } from '../shared/utilities/animation.utility';

import * as fromLayout from '../core/store/layout/layout.actions';
import * as fromSdr from '../core/store/sdr/sdr.actions';
import * as fromSidebar from '../core/store/sidebar/sidebar.actions';
import { SidebarItemType } from '../core/model/sidebar';

@Component({
  selector: 'scholars-data-analytics',
  templateUrl: './data-analytics.component.html',
  styleUrls: ['./data-analytics.component.scss'],
  animations: [fadeIn],
})
export class DataAnalyticsComponent implements OnInit {

  public subOrganizationForm = new FormGroup({
    selectedOrganization: new FormControl('selectedOrganization'),
  });

  public analyticViews: Observable<AnalyticView[]>;

  public isDashboard: Observable<boolean>;

  public analyticView: Observable<AnalyticView>;

  public document: Observable<SolrDocument>;

  public selectedOrganization: Observable<SolrDocument>;

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.store.dispatch(new fromLayout.CloseSidebarAction());
  }

  constructor(
    private store: Store<AppState>,
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    // see sdr.effect.ts searchSuccessHandler
    // just adding to analytic view on server side should also add search result facets but only show selected
    const sections = (titles: string[], config: any) => {
      return {
        menu: {
          sections: titles.map((title: string) => {
            return {
              collapsed: false,
              items: config.ii ? [
                {
                  type: SidebarItemType.INFO,
                  label: 'Success'
                },
                {
                  type: SidebarItemType.INFO,
                  label: 'Above Average'
                },
                {
                  type: SidebarItemType.INFO,
                  label: 'Average'
                },
                {
                  type: SidebarItemType.INFO,
                  label: 'Below Average'
                },
                {
                  type: SidebarItemType.INFO,
                  label: 'Failure'
                }
              ] : [],
              title,
              collapsible: false
            };
          }),
          classes: `text-primary`
        }
      }
    };
    setTimeout(() => {
      this.store.dispatch(new fromSidebar.LoadSidebarAction(sections(['Position Titles'], {ii: false})));
    }, 1000);
    setTimeout(() => {
      this.store.dispatch(new fromSidebar.LoadSidebarAction(sections(['Position Titles', 'Journal Titles'], {ii: false})));
    }, 2000);
    setTimeout(() => {
      this.store.dispatch(new fromSidebar.LoadSidebarAction(sections(['Position Titles', 'Journal Titles', 'Publishers'], {ii: false})));
    }, 3000);
    this.route.data.pipe(
      tap(data => {
        console.log(data.selectedOrganization);
        // if (data.selectedOrganization) {
        //   console.log('setting form');
        //   this.subOrganizationForm
        //     .patchValue({selectedOrganizationId: data.selectedOrganization.id})
        //   ; //.controls.selectedOrganizationId.setValue(data.selectedOrganization.id);
        // }

      }),
      map(data => data.selectedOrganization)
    );

    // TODO: get organization id from the theme
    this.document = this.store.pipe(
      select(selectResourceById('individual', this.appConfig.organizationId)),
      filter((document: SolrDocument) => document !== undefined),
      // tap(console.log)
    );

    // TODO: get organization id from the theme
    this.selectedOrganization = this.store.pipe(
      select(selectResourceById('individual', this.appConfig.organizationId)),
      withLatestFrom(this.route.data),
      tap(([document, data]) => {
        console.log(document, data.selectedOrganization);
      }),
      filter(([document, data]) => !!document && !!data.selectedOrganization),
      map(([document, data]) => (document as any).hasSubOrganizations.find((so: any) => so.id === data.selectedOrganization.id)),
    );

    this.store.dispatch(new fromLayout.CloseSidebarAction());
    this.store.dispatch(new fromSidebar.UnloadSidebarAction());

    this.analyticViews = this.store.pipe(select(selectAllResources<AnalyticView>('analyticViews')));

    this.analyticView = this.store.pipe(
      select(selectRouterState),
      withLatestFrom(this.analyticViews),
      tap(([router, avs]) => {
        // console.log(router, avs);
      }),
      map(([router, avs]) => avs.find((av: AnalyticView) => !!router && av.name === router.state.params.view))
    );

    this.isDashboard = this.store.pipe(
      select(selectRouterState),
      map((router: any) => !!router && router.state.url === '/data-analytics')
    );

    // next incoming document to another subject before dispatching current organization
    // requires subscription to something in store
    // async pipe is preferrence for subscribing to observable
    // otherwise subscribe and unsubscribe or use rxjs operator that unsubscribes
    this.store.dispatch(new fromSdr.GetOneResourceAction('individual', { id: this.appConfig.organizationId }));
  }

  trackByIndex(index, item) {
    return index;
  }

  onSubmitSelectSubOrganization(): void {
    console.log('submitting form', this.subOrganizationForm.value);
  }

}
