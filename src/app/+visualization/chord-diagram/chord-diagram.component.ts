import { isPlatformServer } from '@angular/common';
import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';

import * as d3 from 'd3';
import { PieArcDatum } from 'd3-shape';

import { v4 as uuidv4 } from 'uuid';

import { CoDataNetwork, DirectedData } from '../../core/store/sdr/sdr.reducer';

@Component({
  selector: 'scholars-chord-diagram',
  templateUrl: './chord-diagram.component.html',
  styleUrls: ['./chord-diagram.component.scss'],
})
export class ChordDiagramComponent implements OnInit {

  @Input() coDataNetwork: CoDataNetwork;

  @Input() action: string;

  @Input() actionPastTense: string;

  @Input() type: string;

  public id = uuidv4();

  private height = 964;
  private width = 964;

  private outerPadding = 0;
  private shellWidth = 16;
  private shellGap = 2;

  private defaultOpacity = .75;
  private hoverOpacity = .15;

  private fontFamily = 'sans-serif';

  private labelFontSize = 16;

  constructor(@Inject(PLATFORM_ID) private platformId: string) { }

  ngOnInit(): void {
    if (isPlatformServer(this.platformId) || this.coDataNetwork === undefined) {
      return;
    }

    setTimeout(() => {
      const { map } = this.coDataNetwork;

      const names = Array.from(new Set(map.flatMap(d => [d.source, d.target])));

      const matrix = this.build(map, names);

      const labelLength = Math.max(...(names.map(n => n.length))) * this.labelFontSize / 1.5;

      const innerRadius = Math.min(this.width, this.height) * .5 - (labelLength + this.outerPadding);
      const outerRadius = innerRadius + this.shellWidth;

      const color = (i: number) => d3.scaleOrdinal(names, d3.schemeCategory10)(names[i]);

      const ribbon = d3.ribbon()
        .radius(innerRadius - this.shellGap)
        .padAngle(1 / innerRadius);

      const arc = d3.arc<PieArcDatum<DirectedData>>()
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
          .filter(dd => matrix[cg.index][dd.index] === 0 && matrix[dd.index][cg.index] === 0 && dd.index !== cg.index)
          .transition()
          .style('opacity', opacity);
      };

      const figure = d3.select('figure');

      const tooltip = figure
        .append('div')
        .style('position', 'absolute')
        .style('opacity', 0)
        .style('background-color', 'white')
        .style('border', 'solid')
        .style('border-width', '1px')
        .style('padding', '10px');

      const positionTooltip = event => tooltip.style('top', `${event.pageY + 15}px`).style('left', `${event.pageX + 15}px`);

      const svg = figure
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
        .attr('font-weight', d => names[d.index] === this.coDataNetwork.name ? 'bold' : 'normal')
        .text(d => names[d.index]);

      const groupPath = group
        .join('g')
        .call(g => g.append('path')
          .attr('d', arc)
          .attr('fill', d => names[d.index] === this.coDataNetwork.name ? 'black' : color(d.index))
          .attr('stroke', '#fff')
          .on('mouseover', (e, d) => {
            fade(this.hoverOpacity)(e, d);

            tooltip.transition()
              .style('opacity', 1);

            if (names[d.index] === this.coDataNetwork.name) {
              const numOfLinks = Object.keys(this.coDataNetwork.linkCounts).length;
              tooltip.html(`<span>${names[d.index]}</span><br/><span>${numOfLinks} Co-${this.action}${numOfLinks > 1 ? 's' : ''}</span>`);
            } else {
              const linkCount = this.coDataNetwork.linkCounts[names[d.index]];
              tooltip.html(`<span>${names[d.index]}</span><br/><span>${linkCount} Joint ${this.type}${linkCount > 1 ? 's' : ''}</span>`);
            }

          })
          .on('mousemove', positionTooltip)
          .on('mouseout', (e, d) => {
            fade(this.defaultOpacity)(e, d);

            tooltip.transition()
              .style('opacity', 0);
          }));

      const ribbons = svg.append('g')
        .attr('fill-opacity', this.defaultOpacity)
        .selectAll('g')
        .data(chords)
        .join('path')
        .attr('d', <any>ribbon)
        .attr('fill', d => color(d.source.index))
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
            .style('opacity', 1);

          tooltip.html(`<span>${names[d.source.index]} co-${this.actionPastTense} ${d.target.value} time${d.target.value > 1 ? 's' : ''} with ${names[d.target.index]}</span>`);
        })
        .on('mousemove', positionTooltip)
        .on('mouseout', () => {
          ribbons
            .transition()
            .style('opacity', this.defaultOpacity);
          groupPath
            .transition()
            .style('opacity', this.defaultOpacity);

          tooltip.transition()
            .style('opacity', 0);
        });

    });
  }

  private build = (data, names) => {
    const index = new Map<string, number>(names.map((name, i) => [name, i]));
    const matrix: number[][] = Array.from(index, () => new Array(names.length).fill(0));
    for (const { source, target, count } of data) {
      matrix[index.get(source)][index.get(target)] += count;
    }

    return matrix;
  }

}
