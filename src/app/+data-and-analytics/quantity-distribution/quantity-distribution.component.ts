import { isPlatformServer } from '@angular/common';
import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subscription, filter } from 'rxjs';

import * as d3 from 'd3';

import { Individual } from '../../core/model/discovery';
import { SidebarItemType, SidebarMenu } from '../../core/model/sidebar';
import { DataAndAnalyticsView, DisplayView, Facet, Filter, OpKey } from '../../core/model/view';
import { DialogService } from '../../core/service/dialog.service';
import { AppState } from '../../core/store';
import { selectResourcesQuantityDistribution } from '../../core/store/sdr';
import { QuantityDistribution } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { id } from '../../shared/utilities/id.utility';
import { getUNSDGByValue, getUNSDGIndexByValue } from '../../shared/utilities/un-sdg.utility';

import * as fromRouter from '../../core/store/router/router.actions';
import * as fromSdr from '../../core/store/sdr/sdr.actions';
import * as fromSidebar from '../../core/store/sidebar/sidebar.actions';

@Component({
  selector: 'scholars-quantity-distribution',
  templateUrl: './quantity-distribution.component.html',
  styleUrls: ['./quantity-distribution.component.scss'],
  animations: [fadeIn],
})
export class QuantityDistributionComponent implements OnChanges, OnDestroy, OnInit {

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

  @Input()
  public height = 586;

  @Input()
  public width = 896;

  @Output()
  public labelEvent: EventEmitter<string>;

  public id: string;

  private sidebarMenuSections: { [key: string]: { facet:Facet, index: number } };

  private subscriptions: Subscription[];

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private store: Store<AppState>,
    private dialog: DialogService,
  ) {
    this.labelEvent = new EventEmitter<string>();
    this.id = id();
    this.sidebarMenuSections = {};
    this.subscriptions = [];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    const menu: SidebarMenu = {
      sections: this.dataAndAnalyticsView.facets.map((facet: Facet, index: number) => {
        this.sidebarMenuSections[facet.field] = { facet, index};
        return {
          title: facet.name,
          expandable: facet.expandable,
          collapsible: facet.collapsible,
          collapsed: facet.collapsed,
          useDialog: facet.useDialog,
          action: this.dialog.facetEntriesDialog(facet.name, facet.field, true, 1),
          items: [],
        };
      })
    };

    this.store.dispatch(new fromSidebar.LoadSidebarAction({ menu }));

    this.subscriptions.push(
      this.store.pipe(
        select(selectResourcesQuantityDistribution('individual')),
        filter((qd: QuantityDistribution) => !!qd),
      ).subscribe((qd: QuantityDistribution) => {

        d3.selectAll('figure > *').remove();

        setTimeout(() => {
          // set the dimensions and margins of the graph
          const margin = {
            top: 25,
            bottom: 25,
            left: 25,
            right: 25,
          };

          const width = this.width - margin.left - margin.right;
          const height = this.height - margin.top - margin.bottom;

          // append the svg object to the body of the page
          const svg = d3.select(`#${this.id}`)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

          const total = qd.total;

          let position = 0;

          const data = [...qd.distribution as any[]]
            .sort((s1, s2) => {
              // TODO: pass in lookup methods to component
              const i1 = getUNSDGIndexByValue(s1.label);
              const i2 = getUNSDGIndexByValue(s2.label);
              return (i1 < i2) ? -1 : (i1 > i2) ? 1 : 0;
            }).map((s) => {
              s.percentage = (s.count / total);
              s.size = Math.floor(s.percentage * width);
              s.position = position;
              s.middle = s.position + (s.size / 2);
              position += s.size;
              return s;
            });

          const sections = svg.selectAll()
            .data(data)
            .enter();

          sections
            .append('g').append('rect')
            .attr('x', (d) => d.position)
            .attr('y', () => 0)
            .attr('width', (d) => d.size)
            .attr('height', () => 100)
            .attr('fill', (d) => getUNSDGByValue(d.label)?.color);

          sections
            .append('g').append('text')
            .attr('x', (d) => d.middle - 4)
            .attr('y', 50)
            .style('font', '11px')
            .style('font-family', '"Lato", Calibri, Arial, sans-serif')
            .attr('fill', 'white')
            .text((d) => d.count);

          let x = 0;
          let y = 115;
          sections
            .append('g').append('rect')
            .attr('x', (d) => x)
            .attr('y', (d) => (y += 15) - 15)
            .attr('width', () => 10)
            .attr('height', () => 10)
            .attr('fill', (d) => getUNSDGByValue(d.label)?.color);

          x = 0;
          y = 115;
          sections
            .append('g').append('text')
            .attr('x', (d) => x + 15)
            .attr('y', (d) => (y += 15) - 5)
            .style('font', '11px')
            .style('font-family', '"Lato", Calibri, Arial, sans-serif')
            .attr('fill', 'black')
            .text((d) => `SDG ${d.label}, ${d.count}`);
        });
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { filters } = changes;

    const additionalFilters = [];

    if (!!filters) {
      if (!!filters.previousValue) {
        filters.previousValue.forEach((entry: any) => {
          if (filters.currentValue.indexOf(entry) === -1) {
            const section = this.sidebarMenuSections[entry.field];
            if (!!section) {
              this.store.dispatch(new fromSidebar.RemoveSectionAction({
                sectionIndex: section.index,
                itemLabel: entry.value,
                itemField: entry.field,
              }));
            }
          }
        });
      }

      filters.currentValue.forEach((entry: any) => {
        if (filters.previousValue === undefined || filters.previousValue.indexOf(entry) === -1) {
          const section = this.sidebarMenuSections[entry.field];
          if (!!section) {
            this.store.dispatch(new fromSidebar.AddSectionItemAction({
              sectionIndex: section.index,
              sectionItem: {
                type: SidebarItemType.ACTION,
                label: entry.value,
                selected: true,
                action: new fromRouter.RemoveFilter({ filter: entry }),
              }
            }));
          }
        }
      });

      additionalFilters.push(filters.currentValue);
      additionalFilters.shift();
    }

    if (this.organization.id !== this.defaultId && !!this.organization.name) {
      additionalFilters.push({
        field: 'authorOrganization',
        value: this.organization.name,
        opKey: OpKey.EQUALS
      });
    }

    this.dispatch(additionalFilters);
  }

  private dispatch(additionalFilters: Filter[]): void {
    this.store.dispatch(new fromSdr.GetQuantityDistributionAction('individual', {
      label: 'UN SDG',
      query: {
        expression: '*:*'
      },
      filters: [
        ...additionalFilters,
        {
          field: 'class',
          value: 'Document OR type:creativeWork',
          opKey: OpKey.EXPRESSION
        }
      ],
      field: 'tags',
      queue: []
    }));
  }

}
