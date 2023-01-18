import { Component, OnInit } from '@angular/core';

import { PieArcDatum } from 'd3-shape';

import * as d3 from 'd3';

import { v4 as uuidv4 } from 'uuid';

type Debt = { source: string, target: string, value: number; };

@Component({
  selector: 'scholars-chord-diagram',
  templateUrl: './chord-diagram.component.html',
  styleUrls: ['./chord-diagram.component.scss'],
})
export class ChordDiagramComponent implements OnInit {

  private data: Debt[] = [
    { source: "France", target: "Britain", value: 22.4 },
    { source: "Greece", target: "Britain", value: 0.55 },
    { source: "Italy", target: "Britain", value: 26 },
    { source: "Portugal", target: "Britain", value: 19.4 },
    { source: "United States", target: "Britain", value: 345 },
    { source: "Germany", target: "France", value: 53.8 },
    { source: "Greece", target: "France", value: 53.9 },
    { source: "Ireland", target: "France", value: 17.3 },
    { source: "Italy", target: "France", value: 366 },
    { source: "Japan", target: "France", value: 7.73 },
    { source: "Portugal", target: "France", value: 18.3 },
    { source: "Spain", target: "France", value: 118 },
    { source: "United States", target: "France", value: 322 },
    { source: "Britain", target: "Germany", value: 321 },
    { source: "Greece", target: "Germany", value: 19.3 },
    { source: "Ireland", target: "Germany", value: 48.9 },
    { source: "Portugal", target: "Germany", value: 32.5 },
    { source: "Spain", target: "Germany", value: 57.6 },
    { source: "United States", target: "Germany", value: 324 },
    { source: "Britain", target: "Ireland", value: 12 },
    { source: "Greece", target: "Ireland", value: 0.34 },
    { source: "Spain", target: "Ireland", value: 6.38 },
    { source: "Germany", target: "Italy", value: 111 },
    { source: "Greece", target: "Italy", value: 3.22 },
    { source: "Ireland", target: "Italy", value: 2.83 },
    { source: "Portugal", target: "Italy", value: 0.87 },
    { source: "Britain", target: "Japan", value: 28.2 },
    { source: "Germany", target: "Japan", value: 88.5 },
    { source: "Greece", target: "Japan", value: 1.37 },
    { source: "Ireland", target: "Japan", value: 18.9 },
    { source: "Italy", target: "Japan", value: 38.8 },
    { source: "Portugal", target: "Japan", value: 2.18 },
    { source: "Spain", target: "Japan", value: 25.9 },
    { source: "United States", target: "Japan", value: 796 },
    { source: "Greece", target: "Portugal", value: 10.1 },
    { source: "Ireland", target: "Portugal", value: 3.77 },
    { source: "United States", target: "Portugal", value: 0.52 },
    { source: "Britain", target: "Spain", value: 326 },
    { source: "Greece", target: "Spain", value: 0.78 },
    { source: "Italy", target: "Spain", value: 9.79 },
    { source: "Portugal", target: "Spain", value: 62 },
    { source: "United States", target: "Spain", value: 163 },
    { source: "Greece", target: "United States", value: 3.1 },
    { source: "Ireland", target: "United States", value: 11.1 },
    { source: "Italy", target: "United States", value: 3.16 },
  ];

  private height = 600;
  private width = 600;
  private innerRadius = Math.min(this.width, this.height) * .5 - 20;
  private outerRadius = this.innerRadius + 6;

  constructor() { }

  ngOnInit(): void {

    const id = uuidv4();

    const names = Array.from(new Set(this.data.flatMap(d => [d.source, d.target])));

    const matrix = this.build(this.data, names);

    const chords = this.chord(matrix);

    const svg = d3.select("figure#chord")
      .append("svg")
      .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height]);

    svg.append("path")
      .attr("id", id)
      .attr("fill", "none")
      .attr("d", d3.arc()({
        outerRadius: this.outerRadius,
        innerRadius: this.innerRadius,
        startAngle: 0,
        endAngle: 2 * Math.PI
      }));

    svg.append("g")
      .attr("fill-opacity", 0.75)
      .selectAll("g")
      .data(chords)
      .join("path")
      .attr("d", <any>this.ribbon)
      .attr("fill", d => this.color(names, names[d.target.index]))
      .style("mix-blend-mode", "multiply")
      .append("title")
      .text(d => `${names[d.source.index]} owes ${names[d.target.index]} ${this.formatValue(d.source.value)}`);

    svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(chords.groups)
      .join("g")
      .call(g => g.append("path")
        .attr("d", this.arc)
        .attr("fill", d => this.color(names, names[d.index]))
        .attr("stroke", "#fff"))
      .call(g => g.append("text")
        .attr("dy", -3)
        .append("textPath")
        .attr("xlink:href", `#${id}`)
        .attr("startOffset", d => d.startAngle * this.outerRadius)
        .text(d => names[d.index]))
      .call(g => g.append("title")
        .text(d => `${names[d.index]} owes ${this.formatValue(d3.sum(matrix[d.index]))} is owed ${this.formatValue(d3.sum(matrix, row => row[d.index]))}`));
  }

  private color = (names, i) => d3.scaleOrdinal(names, d3.schemeCategory10)(i);

  private formatValue = (x) => `${x.toFixed(0)}B`;

  private ribbon = d3.ribbon()
    .radius(this.innerRadius - 0.5)
    .padAngle(1 / this.innerRadius);

  private arc = d3.arc<PieArcDatum<Debt>>()
    .innerRadius(this.innerRadius)
    .outerRadius(this.outerRadius);

  private chord = (a) =>
    d3.chordDirected()
      .padAngle(12 / this.innerRadius)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)(a);

  private build = (data, names) => {
    const index = new Map<string, number>(names.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(names.length).fill(0));
    for (const { source, target, value } of data) {
      matrix[index.get(source)][index.get(target)] += value;
    }
    return matrix;
  }

}
