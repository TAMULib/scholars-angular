import { Component, EventEmitter, Input, Inject, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, map, take } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../../app.config';
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

  private subscriptions: Subscription[];

  public selectAll: boolean = false;

  public selectedOrganization: Observable<Individual>;

  public organizationsSubject: BehaviorSubject<Individual[]>;

  public organizations: Observable<Individual[]>;

  public selectedPeopleSubject : BehaviorSubject<any[]>;

  public get selectedPeople() : Observable<any[]> {
    return this.selectedPeopleSubject.asObservable();
  }

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private restService: RestService,
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.selectedPeopleSubject = new BehaviorSubject<any[]>([]);
    this.organizationsSubject = new BehaviorSubject<Individual[]>([]);
    this.organizations = this.organizationsSubject.asObservable();

    this.subscriptions = [];
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

  }

  public getSelectedExportView(): Observable<ExportView> {
    return this.selectedExportView.asObservable();
  }

  public onSelectAll(event: Event, organization: any): void {
    const checked = (event.target as HTMLInputElement).checked;
    const people = organization.people || [];
    if (checked) {
      this.selectedPeopleSubject.next([...people]);
    } else {
      this.selectedPeopleSubject.next([]);
    }
    const checkboxes = document.querySelectorAll<HTMLInputElement>('.selected-profile-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
  }

  public onSelectPerson(event: Event, person: Individual): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const current = this.selectedPeopleSubject.value;
      if (!current.find(p => p.id === person.id)) {
        this.selectedPeopleSubject.next([...current, person]);
      }
    } else {
      const current = this.selectedPeopleSubject.value.filter(p => p.id !== person.id);
      this.selectedPeopleSubject.next(current);
    }
  }

  public downloadSelectedPeople(organization: any, selected: any): void {
    console.log(selected);
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const orgId = params?.selectedOrganization ? params.selectedOrganization : organization.id;
      const exportName = params?.export.toLowerCase().replace(/ /g, '_');
      console.log("\n exportName: ", exportName);
      const selectedIds = this.selectedPeopleSubject.value.map(p => p.id);

      if (!orgId) {
        console.error('Download failure: Missing Organization id.');
        return;
      }

      if (!selectedIds.length || selectedIds.length === (organization.people?.length ?? 0)) {
        this.restService.get<Blob>(
          organization._links[exportName].href,
          { observe: 'response', responseType: 'blob' as 'json' })
          .pipe(take(1))
          .subscribe((response: any) => {
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = !!contentDisposition
                             ? contentDisposition.match(/^.*filename=(.*)$/)[1] : 'export.zip';
            this.download(response, filename);
          },);
      } else {
          const updatedHref = `${this.appConfig.serviceUrl}/individual/${orgId}/export?type=zip&name=${encodeURIComponent(exportName)}`;
          this.restService.post(
            updatedHref,
            selectedIds,
            { observe: 'response', responseType: 'blob' as 'json', headers: { 'Content-Type': 'application/json' } }
          ).subscribe({
            next: (response: any) => {
              const contentDisposition = response.headers.get('Content-Disposition');

              const filename = !!contentDisposition
                               ? contentDisposition.match(/^.*filename=(.*)$/)[1] : 'selected_profile(s).zip';
              this.download(response, filename);
            },
            error: (err) => console.error('Failed to download selected profiles.', err),
          });
      }
    });
  }

  private download(response: any, defaultFileName = 'profile_summary_download.zip') {
    const blob = response.body || response;
    const contentDisposition = response.headers?.get?.('Content-Disposition');
    const filename = contentDisposition
                    ? contentDisposition.match(/^.*filename=(.*)$/)[1]
                    : defaultFileName;

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

}
