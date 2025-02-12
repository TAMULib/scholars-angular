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

  private margin = { top: 20, right: 20, bottom: 50, left: 70 };
  private width: number;
  private height: number;

  private dataSubscription: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
  }

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
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .style('overflow', 'visible');

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

  private createScales(
    startDate: Date,
    endDate: Date,
    maxCount: number
  ): { xScale: d3.ScaleTime<number, number>; yScale: d3.ScaleLinear<number, number> } {
    const xScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, this.width]);

    const desiredTicks = 5;
    let adjustedMax = maxCount;
    if (maxCount > 0) {
      const tickStep = d3.tickStep(0, maxCount, desiredTicks);
      adjustedMax = maxCount + tickStep;
    }
    const yScale = d3.scaleLinear()
      .domain([0, adjustedMax])
      .nice(desiredTicks)
      .range([this.height, 0]);

    return { xScale, yScale };
  }

  private drawGridAndAxes(
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    gridTickInterval: number,
    tickValues?: Date[]
  ): void {
    const xAxisGenerator = tickValues
      ? d3.axisBottom(xScale).tickValues(tickValues).tickFormat(d3.timeFormat('%Y'))
      : d3.axisBottom(xScale).ticks(d3.timeYear.every(gridTickInterval)).tickFormat(d3.timeFormat('%Y'));

    const xGridGenerator = tickValues
      ? d3.axisBottom(xScale).tickValues(tickValues).tickSize(-this.height).tickFormat(() => '')
      : d3.axisBottom(xScale).ticks(d3.timeYear.every(gridTickInterval)).tickSize(-this.height).tickFormat(() => '');

    const xGrid = this.svg.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0, ${this.height})`)
      .call(xGridGenerator);
    xGrid.select('.domain').remove();
    xGrid.selectAll('line')
      .attr('stroke', 'gray')
      .attr('stroke-opacity', 0.7);

    const yGrid = this.svg.append('g')
      .attr('class', 'grid y-grid')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-this.width).tickFormat(() => ''));
    yGrid.select('.domain').remove();
    yGrid.selectAll('line')
      .attr('stroke', 'gray')
      .attr('stroke-opacity', 0.7);

    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height})`)
      .call(xAxisGenerator);

    this.svg.append('g')
      .call(d3.axisLeft(yScale).ticks(5));

    const xLabelPadding = -10;
    const yLabelPadding = 35;

    this.svg.append('text')
      .attr('class', 'x-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', this.width / 2)
      .attr('y', this.height + this.margin.bottom + xLabelPadding)
      .text('Years');

    this.svg.append('text')
      .attr('class', 'y-axis-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2)
      .attr('y', -this.margin.left + yLabelPadding)
      .text('Publication Count');
  }

  private drawRightBorder(): void {
    this.svg.append('line')
      .attr('class', 'right-border')
      .attr('x1', this.width)
      .attr('y1', 0)
      .attr('x2', this.width)
      .attr('y2', this.height)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);
  }

  private drawLine(
    seriesData: Array<{ date: Date; count: number }>,
    color: string,
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    const lineGenerator = d3.line<{ date: Date; count: number }>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveLinear);

    this.svg.append('path')
      .datum(seriesData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', lineGenerator);
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
      const currentYear = new Date().getFullYear();
      const fallbackStartYearDate = new Date(currentYear - 4, 0, 1);
      const fallbackEndYearDate = new Date(currentYear, 0, 1);
      const gridTickInterval = 1;
      const maxCount = 1;

      const { xScale, yScale } = this.createScales(fallbackStartYearDate, fallbackEndYearDate, maxCount);
      const tickValues = d3.timeYear.range(
        fallbackStartYearDate,
        d3.timeYear.offset(fallbackEndYearDate, 1),
        gridTickInterval
      );

      this.drawGridAndAxes(xScale, yScale, gridTickInterval, tickValues);
      this.drawRightBorder();
      return;
    }

    const [minDate, maxDate] = d3.extent(allDataPoints, d => d.date) as [Date, Date];
    const tenYearsAgo = new Date(new Date().getFullYear() - 10, 0, 1);
    const startYearDate = minDate > tenYearsAgo ? tenYearsAgo : minDate;
    const endYearDate = new Date(maxDate.getFullYear(), 0, 1);

    seriesByFilter.forEach(seriesObj => {
      const dataMap = new Map<number, number>();
      seriesObj.seriesData.forEach(d => dataMap.set(d.date.getFullYear(), d.count));

      const completeData: Array<{ date: Date; count: number }> = [];
      for (let year = startYearDate.getFullYear(); year <= endYearDate.getFullYear(); year++) {
        completeData.push({ date: new Date(year, 0, 1), count: dataMap.get(year) ?? 0 });
      }
      seriesObj.seriesData = completeData;
    });

    const dataSpanYears = endYearDate.getFullYear() - startYearDate.getFullYear();
    const gridTickInterval = dataSpanYears >= 100 ? 10 : 5;

    const completeAllDataPoints = seriesByFilter.flatMap(seriesObj => seriesObj.seriesData);
    const maxCount = d3.max(completeAllDataPoints, d => d.count) || 0;

    const { xScale, yScale } = this.createScales(startYearDate, endYearDate, maxCount);

    this.drawGridAndAxes(xScale, yScale, gridTickInterval);

    seriesByFilter.forEach(filterSeries => {
      if (filterSeries.seriesData.length > 0) {
        this.drawLine(filterSeries.seriesData, filterSeries.color, xScale, yScale);
      }
    });

    this.drawRightBorder();
  }
}
