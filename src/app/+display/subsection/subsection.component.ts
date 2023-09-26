import { AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, NavigationStart, Params, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Individual } from '../../core/model/discovery';
import { SdrPage } from '../../core/model/sdr';
import { Sort } from '../../core/model/view';
import { DisplaySubsectionView } from '../../core/model/view/display-view';
import { getResourcesPage, getSubsectionResources, loadBadges } from '../../shared/utilities/view.utility';

@Component({
  selector: 'scholars-subsection',
  templateUrl: './subsection.component.html',
  styleUrls: ['./subsection.component.scss'],
})
export class SubsectionComponent implements AfterViewInit, OnInit, OnDestroy {

  @Input()
  public subsection: DisplaySubsectionView;

  @Input()
  public individual: Individual;

  public resources: BehaviorSubject<any[]>;

  public page: Observable<SdrPage>;

  public pageSizeOptions = [5, 10, 25, 50, 100];

  private subscriptions: Subscription[];

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resources = new BehaviorSubject<any[]>([]);
    this.subscriptions = [];
  }

  ngAfterViewInit() {
    loadBadges(this.platformId);
  }

  ngOnInit() {
    this.subscriptions.push(
      this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => loadBadges(this.platformId))
    );
    const resources = getSubsectionResources(this.individual[this.subsection.field], this.subsection.filters);
    this.page = this.route.queryParams.pipe(
      map((params: Params) => {
        const pageSize = params[`${this.subsection.name}.size`] ? Number(params[`${this.subsection.name}.size`]) : this.subsection.pageSize;
        const pageNumber = params[`${this.subsection.name}.page`] ? Number(params[`${this.subsection.name}.page`]) : 1;
        const totalElements = this.resources.getValue().length;
        const totalPages = Math.ceil(totalElements / pageSize);
        return { size: pageSize, number: pageNumber, totalElements, totalPages };
      })
    );
    this.resources.next(resources);
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

}
