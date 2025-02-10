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
  // Note: max width is reduced from 800 to 700.
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
    // Only run D3 code in the browser.
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
    // Select the container by its unique id.
    const element = d3.select(`#${this.id}`);

    // Define the overall SVG width/height and inner chart dimensions.
    // Max width reduced from 800 to 700.
    this.width = 700 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;

    // Append an SVG element and a group (g) element for margins.
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
   * Every time new filter data arrives, the chart is redrawn.
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
   * 3. Draw a line connecting the points.
   *
   * The x-axis uses a time scale with tick marks every 10 years and the y-axis represents the count.
   */
  private drawScatterplot(filters: FrequencyGraphFilter[]): void {
    // Clear any existing chart content.
    this.svg.selectAll('*').remove();

    // Prepare arrays to compute overall domain and group series by filter.
    let allDataPoints: Array<{ date: Date; count: number }> = [];
    const seriesByFilter = filters.map(filter => {
      // Convert each pivot in the series to a data point.
      const seriesData = filter.series
        .map((pivot: SdrFacetPivot) => {
          const rawDate = new Date(pivot.value);
          if (!isNaN(rawDate.getTime())) {
            const year = rawDate.getFullYear();
            // Set the date to January 1st of the year.
            return { date: new Date(year, 0, 1), count: pivot.count };
          }
          return null;
        })
        .filter(d => d !== null) as Array<{ date: Date; count: number }>;

      // Sort the series data by date.
      seriesData.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Add these points to the overall array.
      allDataPoints = allDataPoints.concat(seriesData);
      return { color: filter.color, seriesData };
    });

    // Exit if there is no data to display.
    if (allDataPoints.length === 0) {
      return;
    }

    // Compute the x-axis domain based on the extent of dates.
    const [minDate, maxDate] = d3.extent(allDataPoints, d => d.date) as [Date, Date];
    const startYear = new Date(minDate.getFullYear(), 0, 1);
    const endYear = new Date(maxDate.getFullYear() + 1, 0, 1);

    // Compute the y-axis domain from 0 to the maximum count.
    const maxCount = d3.max(allDataPoints, d => d.count) || 0;

    // Create scales.
    const xScale = d3.scaleTime()
      .domain([startYear, endYear])
      .range([0, this.width]);

    const yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([this.height, 0]);

    // Create axes.
    // Use tick marks every 10 years for the x-axis.
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear.every(10))
      .tickFormat(d3.timeFormat('%Y'));

    const yAxis = d3.axisLeft(yScale)
      .ticks(5);

    // Append axes.
    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height})`)
      .call(xAxis);

    this.svg.append('g')
      .call(yAxis);

    // Draw a line for each filter's series.
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
          .attr('stroke-width', 2)
          .attr('d', lineGenerator);
      }
    });
  }
}
