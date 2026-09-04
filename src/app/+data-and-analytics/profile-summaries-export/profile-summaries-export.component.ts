import { Component, EventEmitter, Input, Inject, OnDestroy, OnInit, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subscription, take } from 'rxjs';

import { APP_CONFIG, AppConfig } from '../../app.config';
import { Individual } from '../../core/model/discovery';
import { IndividualRepo } from '../../core/model/discovery/repo/individual.repo';
import { SidebarItemType, SidebarMenu } from '../../core/model/sidebar';
import { DataAndAnalyticsView, DisplayView, ExportView } from '../../core/model/view';
import { RestService } from '../../core/service/rest.service';
import { AppState } from '../../core/store';

import * as fromSidebar from '../../core/store/sidebar/sidebar.actions';
import { SdrCollection } from 'src/app/core/model/sdr/sdr-collection';

@Component({
  selector: 'scholars-profile-summaries-export',
  templateUrl: './profile-summaries-export.component.html',
  styleUrls: ['./profile-summaries-export.component.scss']
})
export class ProfileSummariesExportComponent implements OnDestroy, OnChanges, OnInit {

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

  public selectedOrganization: Observable<Individual>;

  public organizationsSubject: BehaviorSubject<Individual[]>;

  public organizations: Observable<Individual[]>;

  public selectedPeopleSubject : BehaviorSubject<any[]>;

  public get selectedPeople() : Observable<any[]> {
    return this.selectedPeopleSubject.asObservable();
  }

  public startYear: number | string = '';

  public endYear: number | string = '';

  public isLoadingDateRange = false;

  public minYear: number = 1000;
  public maxYear: number = new Date().getFullYear();
  public availableYears: number[] = [];

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private individualRepo: IndividualRepo,
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private restService: RestService,
    readonly changeDetectorRef: ChangeDetectorRef
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

  private clearSelections(): void {
    this.selectedPeopleSubject.next([]);
    this.startYear = '';
    this.endYear = '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['organization'] && !changes['organization'].firstChange) {
      this.clearSelections();
      const orgObj = changes['organization'].currentValue;
      const orgName = typeof orgObj === 'object' ? orgObj.name : orgObj?.name;

      if(orgName) {
        this.fetchDateRangeByOrganization(orgName);
      }
    }
    const startChanged = changes['startYear'];
    const endChanged = changes['endYear'];
    if (startChanged || endChanged) {
      if (!startChanged.firstChange || !endChanged.firstChange) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            startYear: this.startYear ? String(this.startYear) : null,
            endYear: this.endYear ? String(this.endYear) : null
          },
          queryParamsHandling: 'merge'
        });
      }
    }
  }

  ngOnInit(): void {
    this.selectedExportView = new BehaviorSubject<ExportView>(undefined);

    this.subscriptions.push(
      this.route.queryParams.subscribe((queryParams: Params) => {

        this.startYear = queryParams['startYear'] || '';
        this.endYear = queryParams['endYear'] || '';

        this.populateAvailableYears(this.startYear, this.endYear);

        const exportParam = queryParams.export;
        const activeExportView = this.displayView.exportViews.find((exportView: ExportView) =>
                                  exportParam ? exportView.name === exportParam : !exportView.name);
        if (!activeExportView) {
          console.error("Export view not specified");
        return;
        }

        this.selectedExportView.next(exportParam);
        this.labelEvent.next(this.translate.instant('DATA_AND_ANALYTICS.PROFILE_SUMMARIES', { timePeriod: exportParam || activeExportView.name }));

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
                  type: SidebarItemType.FACET,
                  facet: {
                    type: 'DATE_RANGE',
                    availableYears: this.availableYears,
                    selectedStartYear: this.startYear,
                    selectedEndYear: this.endYear,
                    onStartChange: (year: any) => {
                      this.startYear = year;
                      const orgName = typeof this.organization === 'string' ? this.organization : this.organization?.name;
                      this.updateQueryParams(queryParams.export, this.startYear, this.endYear);
                    },
                    onEndChange: (year: any) => {
                      this.endYear = year;
                      const orgName = typeof this.organization === 'string' ? this.organization : this.organization?.name;
                      this.updateQueryParams(queryParams.export, this.startYear, this.endYear);
                    }
                  },
                  route: ['./'],
                  queryParams: {
                    export: exportView.name,
                    startYear: this.startYear,
                    endYear: this.endYear
                  }
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
    const currentOrgIds = (organization.people || []).map(p => p.id);
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

  private extractFilename(response: any, defaultFileName: string): string {
    const contentDisposition = response.headers?.get('Content-Disposition');
    return contentDisposition?.match(/^.*filename=(.*)$/)[1]?.trim() || defaultFileName;
  }

  public isPersonSelected(person: any): boolean {
    const list = this.selectedPeopleSubject.value || [];
    return list.some(p => p.id === person.id);
  }

  public downloadSelectedPeople(organization: any, selected: any): void {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const orgId = params?.selectedOrganization ? params.selectedOrganization : organization.id;
      const selectedIds = this.selectedPeopleSubject.value.map(p => p.id);

      const rawStart = params['startYear'] || this.startYear;
      const rawEnd = params['endYear'] || this.endYear;

      const exportName = (selected?.name ? selected.name : params?.export ? params.export : '').trim().replace(/\s+/g, ' ');

      const startYearParam = rawStart && String(rawStart).trim() !== '' ? `&startYear=${encodeURIComponent(String(rawStart).trim())}` : '';
      const endYearParam = rawEnd && String(rawEnd).trim() !== '' ? `&endYear=${encodeURIComponent(String(rawEnd).trim())}` : '';

      if (!orgId || !rawStart || !rawEnd) {
        console.error('Download failure: Missing Organization id or Date Range.', { orgId, rawStart, rawEnd });
        return;
      }

      if (!selectedIds.length) {
      const linkKey = params?.export ? params.export.toLowerCase().replace(/ /g, '_') : '';
      let downloadUrl = organization?._links?.[linkKey]?.href ||
        `${this.appConfig.serviceUrl}/individual/${encodeURIComponent(orgId)}/export?type=zip&name=${encodeURIComponent(exportName)}${startYearParam}${endYearParam}`;

      this.restService.get<Blob>(downloadUrl, { observe: 'response', responseType: 'blob' as 'json' })
        .pipe(take(1))
        .subscribe({
          next: (response: any) => this.download(response, this.extractFilename(response, 'export.zip')),
          error: (err) => console.error('Download failed.', err)
        });

    } else {
      const updatedHref = `${this.appConfig.serviceUrl}/individual/${encodeURIComponent(orgId)}/export?type=zip&name=${encodeURIComponent(exportName)}${startYearParam}${endYearParam}`;

      const payload = selectedIds;

      this.restService.post(updatedHref, payload, {
        observe: 'response',
        responseType: 'blob' as 'json',
        headers: { 'Content-Type': 'application/json' }
       })
        .pipe(take(1))
        .subscribe({
          next: (response: any) => this.download(response, this.extractFilename(response, 'selected_profile.zip')),
          error: (err) => console.error('Download failed.', err),
        });
       }
   });
  }

  private download(response: any, filename: any): void {
    const blob = response.body || response;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  private fetchDateRangeByOrganization(orgName: string): void {
    this.isLoadingDateRange = true;

    const sub = this.individualRepo.getDateRange(orgName).subscribe({
      next: (collection: SdrCollection) => {
        const facet = collection.facets?.find(f => f.field === 'publicationDate');
        const entries = facet?.entries?.content || [];

        if (entries.length > 0) {
          const years = entries
            .map(entry => new Date(entry.value).getUTCFullYear())
            .filter(year => !Number.isNaN(year))
            .sort((a, b) => a - b);

          if (years.length > 0) {
            this.startYear = years[0];
            this.endYear = years[years.length - 1];
          } else {
            this.startYear = '';
            this.endYear = new Date().getFullYear();
          }
          this.populateAvailableYears(this.startYear, this.endYear);
          this.updateQueryParams(orgName, String(this.startYear).trim(), String(this.endYear).trim());
        } else {
          this.startYear = '';
          this.endYear = '';
          this.updateQueryParams(orgName, '', '');
        }

        this.isLoadingDateRange = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading date range for organization:', err);
        this.isLoadingDateRange = false;
        this.changeDetectorRef.detectChanges();
      }
    });

    this.subscriptions.push(sub);
  }

  private populateAvailableYears(start?: any, end?: any): void {
    const currentYear = new Date().getFullYear(); // 2026

    const parsedStart = start !== null && start !== undefined && start !== '' ? Number(start) : 1900;
    const parsedEnd = end !== null && end !== undefined && end !== '' ? Number(end) : currentYear;

    const minBoundary = !isNaN(parsedStart) ? parsedStart : 1900;
    const maxBoundary = !isNaN(parsedEnd) ? parsedEnd : currentYear;

    this.availableYears = [];
    for (let year = maxBoundary; year >= minBoundary; year--) {
      this.availableYears.push(year);
    }
  }

  private updateQueryParams(orgName: string, startYear: any, endYear: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        organization: orgName || null,
        startYear: startYear ? String(startYear) : null,
        endYear: endYear ? String(endYear) : null
      },
      queryParamsHandling: 'merge'
    });
  }

}
