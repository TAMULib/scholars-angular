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
  // Generate a unique id for the chart container.
  public id: string = id();

  // Input: An observable of FrequencyGraphFilter arrays.
  @Input() public selectedFilters: Observable<FrequencyGraphFilter[]>;

  // D3 chart variables.
  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private margin = { top: 20, right: 20, bottom: 30, left: 50 };
  // Overall width is reduced from 800 to 700.
  private width: number;
  private height: number;
  private dataSubscription: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Additional initialization if needed.
  }

  /**
   * Create the chart once the view has been initialized.
   */
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initChart();
      this.subscribeToFilters();
    }
  }

  /**
   * Watch for changes on the @Input property.
   * If a new observable is provided, unsubscribe from the previous one and subscribe to the new one.
   */
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

  /**
   * Initialize the SVG element inside the <figure> container.
   */
  private initChart(): void {
    const element = d3.select(`#${this.id}`);
    // Set overall width to 700 (instead of 800) before subtracting margins.
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

  /**
   * Subscribe to the selectedFilters observable.
   * Redraws the chart when new data arrives.
   */
  private subscribeToFilters(): void {
    if (this.selectedFilters) {
      this.dataSubscription = this.selectedFilters.subscribe((filters: FrequencyGraphFilter[]) => {
        this.drawScatterplot(filters);
      });
    }
  }

  /**
 * Draw or update the frequency graph based on the provided filters.
 *
 * Each filter contains a series of SdrFacetPivot items where:
 * - pivot.value is an ISO date string (e.g., "1979-01-01T00:00:00Z").
 * - pivot.count is the number of publications for that year.
 *
 * For each filter we:
 * 1. Convert the ISO date string into a Date (set to Jan 1 of that year).
 * 2. Sort the series data in chronological order.
 * 3. Complete the series so that it contains a datapoint for every year between
 *    the overall grid minimum and maximum, inserting a 0 count if necessary.
 * 4. Draw a line connecting the points.
 *
 * The x-axis uses a time scale whose grid always starts at at least “10 years ago” and
 * uses a tick interval that remains 5 years until the data spans 100 or more years.
 * Grid lines are styled in gray with no axis domain lines.
 */
private drawScatterplot(filters: FrequencyGraphFilter[]): void {
  // Clear any existing chart content.
  this.svg.selectAll('*').remove();

  // Prepare arrays for overall domain computation and group series by filter.
  let allDataPoints: Array<{ date: Date; count: number }> = [];
  const seriesByFilter = filters.map(filter => {
    const seriesData = filter.series
      .map((pivot: SdrFacetPivot) => {
        const rawDate = new Date(pivot.value);
        if (!isNaN(rawDate.getTime())) {
          const year = rawDate.getFullYear();
          // Set the date to January 1st of that year.
          return { date: new Date(year, 0, 1), count: pivot.count };
        }
        return null;
      })
      .filter(d => d !== null) as Array<{ date: Date; count: number }>;

    // Sort the series data by date.
    seriesData.sort((a, b) => a.date.getTime() - b.date.getTime());
    allDataPoints = allDataPoints.concat(seriesData);
    return { color: filter.color, seriesData };
  });

  // Exit if there is no data to display.
  if (allDataPoints.length === 0) {
    return;
  }

  // Compute overall min and max dates from the data.
  let [minDate, maxDate] = d3.extent(allDataPoints, d => d.date) as [Date, Date];

  // Always render the grid with a minimum of 10 years ago.
  const tenYearsAgo = new Date(new Date().getFullYear() - 10, 0, 1);
  // If the data's minimum is more recent than 10 years ago, use 10 years ago.
  const startYearDate = (minDate > tenYearsAgo ? tenYearsAgo : minDate);
  const endYearDate = new Date(maxDate.getFullYear(), 0, 1);

  // --- New code to complete the series for every year ---
  seriesByFilter.forEach(seriesObj => {
    const originalData = seriesObj.seriesData;
    // Build a map: year -> count.
    const dataMap = new Map<number, number>();
    originalData.forEach(d => {
      dataMap.set(d.date.getFullYear(), d.count);
    });
    // Build a new array that includes every year from start to end.
    const completeData: Array<{ date: Date; count: number }> = [];
    for (let year = startYearDate.getFullYear(); year <= endYearDate.getFullYear(); year++) {
      completeData.push({ date: new Date(year, 0, 1), count: dataMap.get(year) ?? 0 });
    }
    seriesObj.seriesData = completeData;
  });
  // --- End new code ---

  // Calculate the data span in years.
  const dataSpanYears = endYearDate.getFullYear() - startYearDate.getFullYear();
  // Use a 5-year tick interval until the data spans 100 years; thereafter, use 10-year intervals.
  let gridTickInterval: number = 5;
  if (dataSpanYears >= 100) {
    gridTickInterval = 10;
  }

  // Generate an array of tick values from startYearDate to endYearDate (inclusive)
  const tickValues = d3.timeYear.range(
    startYearDate,
    d3.timeYear.offset(endYearDate, 1), // offset ensures endYearDate is included
    gridTickInterval
  );

  // Recompute the maximum count from the completed data.
  const completeAllDataPoints = seriesByFilter.flatMap(seriesObj => seriesObj.seriesData);
  const maxCount = d3.max(completeAllDataPoints, d => d.count) || 0;

  // Create scales.
  const xScale = d3.scaleTime()
    .domain([startYearDate, endYearDate])
    .range([0, this.width]);

  const yScale = d3.scaleLinear()
    .domain([0, maxCount])
    .nice()
    .range([this.height, 0]);

  // Add vertical grid lines.
  const xGrid = this.svg.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", "translate(0," + this.height + ")")
    .call(
      d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(gridTickInterval))
        .tickSize(-this.height)
        .tickFormat(() => "")
    );
  // Remove the domain line and style grid lines.
  xGrid.select(".domain").remove();
  xGrid.selectAll("line")
    .attr("stroke", "gray")
    .attr("stroke-opacity", 0.7);

  // Add horizontal grid lines.
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

  // Create and append axes.
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

  // Draw a line for each filter's series with a bolder stroke.
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
