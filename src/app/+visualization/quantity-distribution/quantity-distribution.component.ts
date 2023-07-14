import { isPlatformServer } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Observable, filter, map, take } from 'rxjs';

import * as d3 from 'd3';

import { SolrDocument } from '../../core/model/discovery';
import { Filter, OpKey } from '../../core/model/view';
import { AppState } from '../../core/store';
import { selectResourcesQuantityDistribution } from '../../core/store/sdr';
import { QuantityDistribution } from '../../core/store/sdr/sdr.reducer';
import { fadeIn } from '../../shared/utilities/animation.utility';
import { id } from '../../shared/utilities/id.utility';
import { getUNSDGByValue, getUNSDGIndexByValue } from '../../shared/utilities/un-sdg.utility';

import * as fromSdr from '../../core/store/sdr/sdr.actions';

@Component({
  selector: 'scholars-quantity-distribution',
  templateUrl: './quantity-distribution.component.html',
  styleUrls: ['./quantity-distribution.component.scss'],
  animations: [fadeIn],
})
export class QuantityDistributionComponent implements OnDestroy, OnInit {

  @Input() height = 394;
  @Input() width = 986;

  public document: Observable<SolrDocument>;

  public id: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) {
    this.id = id();
  }

  ngOnDestroy() {
    this.store.dispatch(new fromSdr.ClearResourcesAction('individual'));
  }

  ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.store.pipe(
      select(selectResourcesQuantityDistribution('individual')),
      filter((qd: QuantityDistribution) => qd !== undefined),
      take(1)
    ).subscribe((qd: QuantityDistribution) => {

      setTimeout(() => {
        // set the dimensions and margins of the graph
        const margin = {
          top: 100,
          bottom: 100,
          left: 100,
          right: 50,
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
            return (i1 < i2) ? -1 : (i1 > i2) ? 1: 0;
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
    });

    const additionalFilters = [];

    const hasParentRouteData = this.route.parent && this.route.parent.data;

    if (hasParentRouteData) {
      this.document = this.route.parent.data.pipe(map(data => data.document));

      this.route.parent.data.subscribe(data => {
        const document = data.document;

        if (document.class === 'Organization') {
          additionalFilters.push({
            field: 'authorOrganization',
            value: document.name,
            opKey: OpKey.EQUALS
          });

          this.dispatch(additionalFilters);
        }
      });
    }

    if (!hasParentRouteData) {
      this.dispatch(additionalFilters);
    }

  }

  private dispatch(additionalFilters: Filter[]): void {
    // console.log('dispatch', additionalFilters);
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
