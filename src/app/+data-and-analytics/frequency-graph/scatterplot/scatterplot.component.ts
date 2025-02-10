import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  PLATFORM_ID
} from '@angular/core';
import * as d3 from 'd3';
import { Observable, Subscription } from 'rxjs';

import { id } from '../../../shared/utilities/id.utility';
import { SdrFacetPivot } from '../../../core/model/sdr/sdr-facet-pivot';
import { FrequencyGraphFilter } from '../frequency-graph.component';

@Component({
  selector: 'scholars-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScatterplotComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  public id: string = id();

  @Input() public selectedFilters: Observable<FrequencyGraphFilter[]>;

  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

  private margin = { top: 20, right: 20, bottom: 30, left: 50 };

  private width: number;

  private height: number;

  private dataSubscription: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initChart();
      this.subscribeToFilters();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedFilters'] && !changes['selectedFilters'].isFirstChange()) {
      if (this.dataSubscription) {
        this.dataSubscription.unsubscribe();
      }
      this.subscribeToFilters();
    }
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  private initChart(): void {
    const element = d3.select(`#${this.id}`);
    this.width = 700 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;

    const svgContainer = element
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.svg = svgContainer
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  private subscribeToFilters(): void {
    if (this.selectedFilters) {
      this.dataSubscription = this.selectedFilters.subscribe((filters: FrequencyGraphFilter[]) => {
        this.drawScatterplot(filters);
      });
    }
  }

private drawScatterplot(filters: FrequencyGraphFilter[]): void {
  this.svg.selectAll('*').remove();

  let allDataPoints: Array<{ date: Date; count: number }> = [];
  const seriesByFilter = filters.map(filter => {
    const seriesData = filter.series
      .map((pivot: SdrFacetPivot) => {
        const rawDate = new Date(pivot.value);
        if (!isNaN(rawDate.getTime())) {
          const year = rawDate.getFullYear();
          return { date: new Date(year, 0, 1), count: pivot.count };
        }
        return null;
      })
      .filter(d => d !== null) as Array<{ date: Date; count: number }>;

    seriesData.sort((a, b) => a.date.getTime() - b.date.getTime());
    allDataPoints = allDataPoints.concat(seriesData);
    return { color: filter.color, seriesData };
  });

  if (allDataPoints.length === 0) {
    return;
  }

  let [minDate, maxDate] = d3.extent(allDataPoints, d => d.date) as [Date, Date];

  const tenYearsAgo = new Date(new Date().getFullYear() - 10, 0, 1);
  const startYearDate = (minDate > tenYearsAgo ? tenYearsAgo : minDate);
  const endYearDate = new Date(maxDate.getFullYear(), 0, 1);

  seriesByFilter.forEach(seriesObj => {
    const originalData = seriesObj.seriesData;
    const dataMap = new Map<number, number>();
    originalData.forEach(d => {
      dataMap.set(d.date.getFullYear(), d.count);
    });
    
    const completeData: Array<{ date: Date; count: number }> = [];
    for (let year = startYearDate.getFullYear(); year <= endYearDate.getFullYear(); year++) {
      completeData.push({ date: new Date(year, 0, 1), count: dataMap.get(year) ?? 0 });
    }
    seriesObj.seriesData = completeData;
  });

  const dataSpanYears = endYearDate.getFullYear() - startYearDate.getFullYear();
  let gridTickInterval: number = 5;
  if (dataSpanYears >= 100) {
    gridTickInterval = 10;
  }

  const tickValues = d3.timeYear.range(
    startYearDate,
    d3.timeYear.offset(endYearDate, 1),
    gridTickInterval
  );

  const completeAllDataPoints = seriesByFilter.flatMap(seriesObj => seriesObj.seriesData);
  const maxCount = d3.max(completeAllDataPoints, d => d.count) || 0;

  const xScale = d3.scaleTime()
    .domain([startYearDate, endYearDate])
    .range([0, this.width]);

  const yScale = d3.scaleLinear()
    .domain([0, maxCount])
    .nice()
    .range([this.height, 0]);

  const xGrid = this.svg.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", "translate(0," + this.height + ")")
    .call(
      d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(gridTickInterval))
        .tickSize(-this.height)
        .tickFormat(() => "")
    );
  xGrid.select(".domain").remove();
  xGrid.selectAll("line")
    .attr("stroke", "gray")
    .attr("stroke-opacity", 0.7);

  const yGrid = this.svg.append("g")
    .attr("class", "grid y-grid")
    .call(
      d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-this.width)
        .tickFormat(() => "")
    );
  yGrid.select(".domain").remove();
  yGrid.selectAll("line")
    .attr("stroke", "gray")
    .attr("stroke-opacity", 0.7);

  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeYear.every(gridTickInterval))
    .tickFormat(d3.timeFormat('%Y'));
  const yAxis = d3.axisLeft(yScale)
    .ticks(5);

  this.svg.append('g')
    .attr('transform', `translate(0, ${this.height})`)
    .call(xAxis);

  this.svg.append('g')
    .call(yAxis);

  seriesByFilter.forEach(filterSeries => {
    if (filterSeries.seriesData.length > 0) {
      const lineGenerator = d3.line<{ date: Date; count: number }>()
        .x(d => xScale(d.date))
        .y(d => yScale(d.count))
        .curve(d3.curveLinear);

      this.svg.append('path')
        .datum(filterSeries.seriesData)
        .attr('fill', 'none')
        .attr('stroke', filterSeries.color)
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);
    }
  });
}
}
