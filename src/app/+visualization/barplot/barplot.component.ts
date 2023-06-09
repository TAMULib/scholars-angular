import { isPlatformServer } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as d3 from 'd3';

import { id } from '../../shared/utilities/id.utility';
import { Observable } from 'rxjs';
import { Datum, ResearchAge } from '../../core/store/sdr/sdr.reducer';

export interface BarplotInput {
  data: Datum[],
}

@Component({
  selector: 'scholars-barplot',
  templateUrl: './barplot.component.html',
  styleUrls: ['./barplot.component.scss']
})
export class BarplotComponent implements OnInit {

  @Input() height = 586;
  @Input() width = 396;

  @Input() input: BarplotInput;

  public id: string;

  constructor(
    @Inject(PLATFORM_ID) private platformId: string,
    private router: Router,
    private translate: TranslateService
  ) {
    this.id = id();
  }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId)) {
      return;
    }

    console.log(this.input);

    setTimeout(() => {

      const data = this.input.data.reverse();

      // set the dimensions and margins of the graph
      const margin = {
        top: 100,
        bottom: 100,
        left: 70,
        right: 50,
      };

      const width = this.width - margin.left - margin.right;
      const height = this.height - margin.top - margin.bottom;

      const max = d3.max(data.map((d: any) => d.value));

      // append the svg object to the body of the page
      var svg = d3.select(`#${this.id}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // researchers
      var x = d3.scaleLinear()
        .range([0, width])
        .domain([0, max]);

      // research
      var x2 = d3.scaleLinear()
        .domain([0, 20000])
        .range([0, width]);

      // age groups
      var y = d3.scaleBand()
        .range([0, height])
        .domain(data.map((d) => d.label))
        .padding(.1);

      // bottom axis
      svg.append('g')
        .attr('transform', `translate(5,${height + 15})`)
        .call(d3.axisBottom(x).ticks(max / 500).tickSize(0))
        .call(g => g.select('.domain').remove())
        .selectAll('text')
        .style('text-anchor', 'end');

      // top axis
      svg.append("g")
        .attr("transform", "translate(5,-10)")
        .call(d3.axisTop(x2).ticks(20000 / 5000).tickSize(0))
        .call(g => g.select(".domain").remove())
        .selectAll("text")
        .style("text-anchor", "end");

      // left axis
      svg.append('g')
        .attr('transform', 'translate(-10,0)')
        .call(d3.axisLeft(y).tickSize(0).tickFormat((d, i) => data[i].label))
        .call(g => g.select('.domain').remove())
        .selectAll('text')
        .style('text-anchor', 'end');

      const bar = svg.selectAll()
        .data(data)
        .enter()
        .append("g");

      bar.append('rect')
        .attr('x', x(0))
        .attr('y', (d) => y(d.label))
        .attr('width', (d) => x(d.value))
        .attr('height', y.bandwidth())
        .attr('fill', 'steelblue');

      bar.append('text')
        .attr("x", (d) => x(d.value) + 5)
        .attr("y", (d) => y(d.label) + (y.bandwidth() / 2))
        .attr("dy", ".35em")
        .style("font", "12px times")
        .attr('fill', 'steelblue')
        .text((d) => d.value);
    });

  }

}
