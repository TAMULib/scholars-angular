import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, take } from 'rxjs';

import { Individual } from '../../core/model/discovery';
import { SidebarItemType, SidebarMenu } from '../../core/model/sidebar';
import { DataAndAnalyticsView, DisplayView, ExportView } from '../../core/model/view';
import { RestService } from '../../core/service/rest.service';
import { AppState } from '../../core/store';

import * as fromSidebar from '../../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-profile-summaries-export',
  templateUrl: './profile-summaries-export.component.html',
  styleUrls: ['./profile-summaries-export.component.scss']
})
export class ProfileSummariesExportComponent implements OnDestroy, OnInit {

  @Input()
  public organization: Individual;

  @Input()
  public displayView: DisplayView;

  @Input()
  public dataAndAnalyticsView: DataAndAnalyticsView;

  @Input()
  public defaultId: string;

  @Output()
  public labelEvent: EventEmitter<string>;

  public selectedExportView: BehaviorSubject<ExportView>;

  // @todo this is an initial test, it needs to be changed to update dynamically such as when a different org is selected.
  public people: Object[];

  private subscriptions: Subscription[];

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private rest: RestService,
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.subscriptions = [];
    this.people = [];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.selectedExportView = new BehaviorSubject<ExportView>(undefined);

    this.subscriptions.push(
      this.route.queryParams.subscribe((queryParams: Params) => {

        const menu: SidebarMenu = {
          sections: [
            {
              title: this.translate.instant('DATA_AND_ANALYTICS.TIME_PERIOD'),
              items: this.displayView.exportViews.map((exportView: ExportView) => {
                const selected = exportView.name === queryParams.export;

                if (selected) {
                  this.selectedExportView.next(exportView);
                  this.labelEvent.next(this.translate.instant('DATA_AND_ANALYTICS.PROFILE_SUMMARIES', { timePeriod: exportView.name }));
                }
                return {
                  label: exportView.name,
                  type: SidebarItemType.LINK,
                  route: ['./'],
                  queryParams: {
                    export: exportView.name
                  },
                  selected
                }
              }),
              collapsed: false,
              collapsible: false,
              expandable: false,
              useDialog: false
            }
          ]
        };

        this.store.dispatch(new fromSidebar.LoadSidebarAction({ menu }));
      })
    );

    this.organization?.people?.forEach((person: any) => {
      if (person?.id && person?.label && person?.title) {
        this.people.push({
          id: person.id,
          label: person.label,
          title: person.title,
          selected: false
        });
      }
    });
  }

  public getSelectedExportView(): Observable<ExportView> {
    return this.selectedExportView.asObservable();
  }

  public download(exportView: ExportView): void {
    const link = exportView.name.toLowerCase().replace(/ /g, '_');
    const peopleIds = [];

    this.people.forEach((person: any) => {
      if (person?.id && person?.selected === true) {
        peopleIds.push(person.id);
      }
    });

    console.log("DEBUG: peopleIds = ", peopleIds);
    console.log("DEBUG: link = ", link);
    // @todo this will require IndividualExportController, @GetMapping("/individual/{id}/export"), be updated with something like @RequestParam(value = "people", required = false) List<String> people.
    // There are potential problems because of the size of the ids and a POST may be needed.

    /*this.rest.get<Blob>(this.organization._links[link].href, { observe: 'response', responseType: 'blob' as 'json' }, false)
      .pipe(take(1))
      .subscribe((response: any) => {
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = !!contentDisposition
          ? contentDisposition.match(/^.*filename=(.*)$/)[1]
          : 'export.zip';

        const url = window.URL.createObjectURL(response.body);
        const anchor = document.createElement('a');
        anchor.download = filename;
        anchor.href = url;
        anchor.click();
      });*/
  }

}
