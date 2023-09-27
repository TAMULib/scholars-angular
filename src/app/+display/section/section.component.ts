import { AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { APP_CONFIG, AppConfig } from '../../app.config';
import { Individual } from '../../core/model/discovery';
import { SdrPage } from '../../core/model/sdr';
import { DisplayTabSectionView, Sort } from '../../core/model/view';
import { getResourcesPage, getSubsectionResources, loadBadges } from '../../shared/utilities/view.utility';

@Component({
  selector: 'scholars-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
})
export class SectionComponent implements AfterViewInit, OnInit, OnDestroy {

  @Input()
  public section: DisplayTabSectionView;

  @Input()
  public individual: Individual;

  @Input()
  public display: string;

  public resources: BehaviorSubject<any[]>;

  public page: Observable<SdrPage>;

  public pageSizeOptions = [5, 10, 25, 50, 100];

  private subscriptions: Subscription[];

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    @Inject(PLATFORM_ID) private platformId: string,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resources = new BehaviorSubject<any[]>([]);
    this.subscriptions = [];
  }

  ngAfterViewInit() {
    if (this.section.paginated) {
      loadBadges(this.platformId);
    }
  }

  ngOnInit() {
    if (this.section.paginated) {
      this.subscriptions.push(
        this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => loadBadges(this.platformId))
      );
      const resources = getSubsectionResources(this.individual[this.section.field], this.section.filters);
      this.page = this.route.queryParams.pipe(
        map((params: Params) => {
          const pageSize = params[`${this.section.name}.size`] ? Number(params[`${this.section.name}.size`]) : this.section.pageSize;
          const pageNumber = params[`${this.section.name}.page`] ? Number(params[`${this.section.name}.page`]) : 1;
          const totalElements = this.resources.getValue().length;
          const totalPages = Math.ceil(totalElements / pageSize);
          return { size: pageSize, number: pageNumber, totalElements, totalPages };
        })
      );
      this.resources.next(resources);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  public getResources(): Observable<any[]> {
    return this.resources.asObservable();
  }

  public getResourcesPage(resources: any[], sort: Sort[], page: SdrPage): any[] {
    return getResourcesPage(resources, sort, page);
  }

  public getEmbedSnippet(): string {
    return `<div class="_scholars_embed_" data-collection="individual" data-individual="${this.individual.id}" data-display="${this.display}" data-sections="${this.section.name}"></div>\n\n` + '<!-- This JavaScript only needs to be included once in your HTML -->\n' + `<script type="text/javascript" src="${this.appConfig.embedUrl}/scholars-embed.min.js" async></script>`;
  }

  public copyToClipBoard(copyElement: any, tooltip: NgbTooltip) {
    copyElement.select();
    document.execCommand('copy');
    copyElement.setSelectionRange(0, 0);
    setTimeout(() => tooltip.close(), 2000);
  }

}
