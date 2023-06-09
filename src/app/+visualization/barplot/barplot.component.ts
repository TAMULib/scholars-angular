import { isPlatformServer } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as d3 from 'd3';

import { id } from '../../shared/utilities/id.utility';
import { Observable } from 'rxjs';
import { ResearchAge } from 'src/app/core/store/sdr/sdr.reducer';

@Component({
  selector: 'scholars-barplot',
  templateUrl: './barplot.component.html',
  styleUrls: ['./barplot.component.scss']
})
export class BarplotComponent implements OnInit {

  @Input() height = 400;
  @Input() width = 396;

  @Input() maxX = 40;
  @Input() factorX = 5;

  @Input() maxY = 4000;
  @Input() factorY = 1;

  @Input() scale: number = 1;

  @Input() researchers: ResearchAge;

  @Input() publications: ResearchAge;

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

    // console.log(this.researchers);
    console.log(this.publications.groups);

    setTimeout(() => {

      // set the dimensions and margins of the graph
      const margin = {
        top: 50,
        left: 50,
        right: 50,
        bottom: 50
      };

      this.width = this.width - margin.left - margin.right;
      this.height = this.height - margin.top - margin.bottom;

      const bins = d3.bin()
        .thresholds(40)
        .value((d: any) => {

          console.log(d);

          return d.value;
        })
      (this.publications.groups as any);

      // const svg = d3.select(`#${this.id}`)
      //   .append("svg")
      //     .attr("width", this.width + margin.left + margin.right)
      //     .attr("height", this.height + margin.top + margin.bottom)
      //   .append("g")
      //     .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // svg.append("text")
      //   .attr("class", "x label")
      //   .attr("text-anchor", "end")
      //   .attr("x", this.width / 2)
      //   .attr("y", this.height + margin.top + margin.bottom - 80)
      //   .text("Researchers");

      // svg.append("text")
      //   .attr("class", "y label")
      //   .attr("text-anchor", "end")
      //   .attr("x", margin.top - margin.bottom - 80)
      //   .attr("y", margin.left - 80)
      //   .attr("transform", "rotate(-90)")
      //   .text("Academic age group");

        // // X axis
        // const x = d3.scaleLinear()
        //   .domain([0, this.maxY * this.scale])
        //   .range([0, this.width]);


        // svg.append("g")
        //   .attr("transform", `translate(0, ${this.height})`)
        //   .call(
        //     d3.axisBottom(x)
        //       .tickSize(0)
        //       .tickPadding(10)
        //   );
        //   //  .selectAll("text")
        //   //    .attr("transform", "translate(-10,0)rotate(-45)")
        //   //    .style("text-anchor", "end");


        // // Y axis
        // const y = d3.scaleLinear()
        //   .domain([this.maxX * this.scale, 0])
        //   .range([0, this.height]);

        // svg.append("g")
        //   .call(
        //     d3.axisLeft(y)
        //       .tickSize(0)
        //       .tickPadding(10)
        //   );
        //   // .selectAll("text")
        //   //     .attr("transform", "translate(-5,0) rotate(-45)")
        //   //     .style("text-anchor", "end");

        // Declare the x (horizontal position) scale.
        const x = d3.scaleLinear()
          .domain([bins[0].x0, bins[bins.length - 1].x1])
          .range([margin.left, this.width - margin.right]);

        // Declare the y (vertical position) scale.
        const y = d3.scaleLinear()
          .domain([0, d3.max(bins, (d) => d.length)])
          .range([this.height - margin.bottom, margin.top]);

        // Create the SVG container.
        const svg = d3.select(`#${this.id}`)
          .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add a rect for each bin.
        svg.append("g")
          .attr("fill", "steelblue")
        .selectAll()
        .data(bins)
        .join("rect")
          .attr("x", (d) => x(d.x0) + 1)
          .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
          .attr("y", (d) => y(d.length))
          .attr("height", (d) => y(0) - y(d.length));

        // Add the x-axis and label.
        svg.append("g")
          .attr("transform", `translate(0,${this.height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(this.width / 80).tickSizeOuter(0))
          .call((g) => g.append("text")
              .attr("x", this.width)
              .attr("y", margin.bottom - 4)
              .attr("fill", "currentColor")
              .attr("text-anchor", "end")
              .text(" →"));

        // Add the y-axis and label, and remove the domain line.
        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(this.height / 40))
          .call((g) => g.select(".domain").remove())
          .call((g) => g.append("text")
              .attr("x", -margin.left)
              .attr("y", 10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .text("↑ "));

      });
  }

}
