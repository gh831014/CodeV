import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ModuleGraph as IModuleGraph } from '../services/gemini';

interface Props {
  graph: IModuleGraph;
}

export const ModuleGraph: React.FC<Props> = ({ graph }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(graph.nodes)
      .force('link', d3.forceLink<any, any>(graph.edges).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Arrow markers
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#555')
      .style('stroke', 'none');

    const link = g.append('g')
      .selectAll('line')
      .data(graph.edges)
      .join('line')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', (d: any) => 15 + (d.importance || 5) * 2)
      .attr('fill', (d: any) => {
        switch (d.type) {
          case 'module': return '#10b981';
          case 'class': return '#06b6d4';
          case 'function': return '#f59e0b';
          case 'external_api': return '#ec4899';
          default: return '#71717a';
        }
      })
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d: any) => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [graph]);

  return (
    <div className="w-full h-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Module</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Class</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Function</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold">API</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 600" />
    </div>
  );
};
