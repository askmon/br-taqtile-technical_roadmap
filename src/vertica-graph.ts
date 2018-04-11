import * as d3 from 'd3';

import { Datum } from './models';

const duration = 750;

interface HierarchyNode<T> extends d3.HierarchyNode<T> {
  x0?: number;
  y0?: number;
  width?: number;
}

interface HierarchyPointNode<T> extends d3.HierarchyPointNode<T> {
  x0?: number;
  y0?: number;
}

export class VerticalGraph {
  constructor(
    private readonly treemap: d3.TreeLayout<Datum>,
    private readonly root: HierarchyNode<Datum>,
    private readonly rootSelection: d3.Selection<d3.BaseType, any, HTMLElement, any>,
  ) { }

  build(heigth: number) {
    // setting initial position for root
    this.root.x0 = 0;
    this.root.y0 = heigth / 2;

    this.update(this.root);
  }

  private update(root: d3.HierarchyNode<Datum>) {
    const treeData = this.treemap(root);

    const nodes = treeData.descendants() as HierarchyPointNode<Datum>[];
    const links = nodes.slice(1);

    nodes.forEach(d => d.y = d.depth * 200);

    this.updateNodes(root as HierarchyPointNode<Datum>, nodes);
    this.updateLinks(links);

    // Store the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  private updateNodes(source: HierarchyPointNode<Datum>, nodes: d3.HierarchyNode<Datum>[]) {
    const node = this.rootSelection
                     .selectAll('g.node')
                     .data(nodes, (d: Datum) => d.id.replace('_', ''));

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node.enter()
                          .append('g')
                          .attr('class', 'node')
                          .attr('transform', () => `translate(${source.x0}, ${source.x0})`)
                          .on('click', this.onClick)
                          ;

    // Add labels for the nodes
    nodeEnter.append('text')
             .attr('dy', '.35em')
             .attr('x', () => 6)
             .text(d => d.data.name)
             .each(function(this: any, d: HierarchyNode<Datum>) { d.width = Math.max(32, this.getComputedTextLength() + 12); })
             ;

    nodeEnter.insert('rect', 'text')
             .attr('ry', 6)
             .attr('rx', 6)
             .attr('y', -10)
             .attr('height', 20)
             .attr('width', (d: HierarchyNode<Datum>) => d.width)
             ;

    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
              .duration(duration)
              .attr('transform', (d: d3.HierarchyPointNode<Datum>) => `translate(${d.x}, ${d.y})`)
              ;

    // Remove any exiting nodes
    const nodeExit = node.exit()
                         .transition()
                         .duration(duration)
                         .attr('transform', () => `translate(${source.x}, ${source.y})`)
                         .remove();

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
            .style('fill-opacity', 1e-6);
  }

  private updateLinks(links: d3.HierarchyNode<Datum>[]) {
    const link = this.rootSelection
                     .selectAll('path.link')
                     .data(links)
                     ;
    // adds the links between the nodes
    const linkEnter = link.enter()
                          .insert('path', 'g')
                          .attr('class', 'link')
                          .attr("d", d => diagonal(d, d))
                          ;

    const linkUpdate = linkEnter.merge(link);

    linkUpdate
      .transition()
      .duration(duration)
      .attr('d', d => diagonal(d.parent, d));

    const linkExit = link.exit();

    linkExit
      .transition()
      .duration(duration)
      .attr('d', d => diagonal(d, d))
      .remove();
  }

  private onClick = d => {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.update(d);
  }
}


function diagonal(from, to) {
  return `M ${from.x} ${from.y}
          C ${from.x} ${(from.y + to.y) / 2},
            ${to.x} ${(from.y + to.y) / 2},
            ${to.x} ${to.y}`;
}
