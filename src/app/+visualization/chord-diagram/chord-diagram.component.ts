import { Component, OnInit } from '@angular/core';

import { PieArcDatum } from 'd3-shape';

import * as d3 from 'd3';


type Debt = { source: string, target: string, value: number; };

@Component({
  selector: 'scholars-chord-diagram',
  templateUrl: './chord-diagram.component.html',
  styleUrls: ['./chord-diagram.component.scss'],
})
export class ChordDiagramComponent implements OnInit {

  private data: Debt[] = [
    { source: 'France', target: 'Britain', value: 22.4 },
    { source: 'Greece', target: 'Britain', value: 0.55 },
    { source: 'Italy', target: 'Britain', value: 26 },
    { source: 'Portugal', target: 'Britain', value: 19.4 },
    { source: 'United States', target: 'Britain', value: 345 },
    { source: 'Germany', target: 'France', value: 53.8 },
    { source: 'Greece', target: 'France', value: 53.9 },
    { source: 'Ireland', target: 'France', value: 17.3 },
    { source: 'Italy', target: 'France', value: 366 },
    { source: 'Japan', target: 'France', value: 7.73 },
    { source: 'Portugal', target: 'France', value: 18.3 },
    { source: 'Spain', target: 'France', value: 118 },
    { source: 'United States', target: 'France', value: 322 },
    { source: 'Britain', target: 'Germany', value: 321 },
    { source: 'Greece', target: 'Germany', value: 19.3 },
    { source: 'Ireland', target: 'Germany', value: 48.9 },
    { source: 'Portugal', target: 'Germany', value: 32.5 },
    { source: 'Spain', target: 'Germany', value: 57.6 },
    { source: 'United States', target: 'Germany', value: 324 },
    { source: 'Britain', target: 'Ireland', value: 12 },
    { source: 'Greece', target: 'Ireland', value: 0.34 },
    { source: 'Spain', target: 'Ireland', value: 6.38 },
    { source: 'Germany', target: 'Italy', value: 111 },
    { source: 'Greece', target: 'Italy', value: 3.22 },
    { source: 'Ireland', target: 'Italy', value: 2.83 },
    { source: 'Portugal', target: 'Italy', value: 0.87 },
    { source: 'Britain', target: 'Japan', value: 28.2 },
    { source: 'Germany', target: 'Japan', value: 88.5 },
    { source: 'Greece', target: 'Japan', value: 1.37 },
    { source: 'Ireland', target: 'Japan', value: 18.9 },
    { source: 'Italy', target: 'Japan', value: 38.8 },
    { source: 'Portugal', target: 'Japan', value: 2.18 },
    { source: 'Spain', target: 'Japan', value: 25.9 },
    { source: 'United States', target: 'Japan', value: 796 },
    { source: 'Greece', target: 'Portugal', value: 10.1 },
    { source: 'Ireland', target: 'Portugal', value: 3.77 },
    { source: 'United States', target: 'Portugal', value: 0.52 },
    { source: 'Britain', target: 'Spain', value: 326 },
    { source: 'Greece', target: 'Spain', value: 0.78 },
    { source: 'Italy', target: 'Spain', value: 9.79 },
    { source: 'Portugal', target: 'Spain', value: 62 },
    { source: 'United States', target: 'Spain', value: 163 },
    { source: 'Greece', target: 'United States', value: 3.1 },
    { source: 'Ireland', target: 'United States', value: 11.1 },
    { source: 'Italy', target: 'United States', value: 3.16 },
  ];

  private height = 964;
  private width = 964;

  private outerPadding = 0;
  private shellWidth = 16;
  private shellGap = 2;

  private defaultOpacity = .8;
  private hoverOpacity = .1;

  private fontFamily = 'sans-serif';

  private labelFontSize = 16;

  constructor() { }

  ngOnInit(): void {
    const names = Array.from(new Set(this.data.flatMap(d => [d.source, d.target])));

    const matrix = this.build(this.data, names);

    const labelLength = Math.max(...(names.map(n => n.length))) * this.labelFontSize / 1.5;

    const innerRadius = Math.min(this.width, this.height) * .5 - (labelLength + this.outerPadding);
    const outerRadius = innerRadius + this.shellWidth;

    const color = (i) => d3.scaleOrdinal(names, d3.schemeCategory10)(names[i]);

    const ribbon = d3.ribbonArrow()
      .radius(innerRadius - this.shellGap)
      .padAngle(1 / innerRadius);

    const arc = d3.arc<PieArcDatum<Debt>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const chord = (a) =>
      d3.chordDirected()
        .padAngle(12 / innerRadius)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending)(a);

    const chords = chord(matrix);

    const fade = (opacity: number) => (p: SVGPathElement, cg: d3.ChordGroup) => {
      ribbons
        .filter(dd => dd.source.index !== cg.index && dd.target.index !== cg.index)
        .transition()
        .style('opacity', opacity);
      groupPath
        .filter(dd => dd.index != cg.index)
        .transition()
        .style('opacity', opacity);
    };

    const tooltip = d3.select('figure#chord')
      .append('div')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('background-color', 'white')
      .style('border', 'solid')
      .style('border-width', '1px')
      .style('padding', '10px');

    const positionTooltip = event => tooltip.style('top', `${event.pageY + 15}px`).style('left', `${event.pageX + 15}px`);

    const svg = d3.select('figure#chord')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', [-this.width / 2, -this.height / 2, this.width, this.height]);

    const group = svg.append('g')
      .attr('font-family', this.fontFamily)
      .attr('font-size', this.labelFontSize)
      .selectAll('g')
      .data(chords.groups)
      .enter()
      .append('g');

    group.append('text')
      .each(d => { d.value = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', d => `rotate(${(d.value * 180 / Math.PI - 90)}) translate(${innerRadius + 26}) ${d.value > Math.PI ? 'rotate(180)' : ''}`)
      .attr('text-anchor', d => d.value > Math.PI ? 'end' : null)
      .text(d => names[d.index]);

    const groupPath = group
      .join('g')
      .call(g => g.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.index))
        .attr('stroke', '#fff')
        .on('mouseover', (p, cg) => {
          fade(this.hoverOpacity)(p, cg);

          tooltip.transition()
            .duration(400)
            .style('opacity', 1);
          tooltip.html(names[cg.index]);
        })
        .on('mousemove', positionTooltip)
        .on('mouseout', (p, cg) => {
          fade(this.defaultOpacity)(p, cg);

          tooltip.style('opacity', 0);
        }));

    const ribbons = svg.append('g')
      .attr('fill-opacity', this.defaultOpacity)
      .selectAll('g')
      .data(chords)
      .join('path')
      .attr('d', <any>ribbon)
      .attr('fill', d => color(d.target.index))
      .on('mouseover', (e, d) => {
        ribbons
          .filter(dd => dd !== d)
          .transition()
          .style('opacity', this.hoverOpacity);
        groupPath
          .filter((dd) => dd.index !== d.source.index && dd.index !== d.target.index)
          .transition()
          .style('opacity', this.hoverOpacity);

        tooltip.transition()
          .duration(400)
          .style('opacity', 1);
        tooltip.html(`${names[d.source.index]} to ${names[d.target.index]}`);
      })
      .on('mousemove', positionTooltip)
      .on('mouseout', () => {
        ribbons
          .transition()
          .style('opacity', this.defaultOpacity);
        groupPath
          .transition()
          .style('opacity', this.defaultOpacity);

        tooltip.style('opacity', 0);
      });
  }

  private build = (data, names) => {
    const index = new Map<string, number>(names.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(names.length).fill(0));
    for (const { source, target, value } of data) {
      matrix[index.get(source)][index.get(target)] += value;
    }

    return matrix;
  }

}
