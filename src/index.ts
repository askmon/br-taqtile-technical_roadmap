import * as d3 from 'd3';
import { Datum, DatumType } from './models';

// var treeData = require('./flare.json');

const treeData = require('./roadmap');

// Set the dimensions and margins of the diagram
const margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 2400 - margin.left - margin.right,
    height = 960 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
const svg = d3.select('body')
  .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

let i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
const treemap = d3.tree<Datum>().size([height, width]);

// Assigns parent, children, height, depth
// root = d3.hierarchy<Datum>(treeData, function(d) { return d.children; });
root = d3.stratify<Datum>()(treeData.filter(i => i.type === DatumType.checkpoint));
root.x0 = height / 2;
root.y0 = 0;

// Collapse after the second level
root.children.forEach(collapse);

update(root);

function update(source) {

  // Assigns the x and y position for the nodes
  const treeData = treemap(root);

  // Compute the new tree layout.
  const nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(d => d.y = d.depth * 200);

  // ****************** Nodes section ***************************

  // Update the nodes...
  const node = svg.selectAll('g.node').data(nodes, d => d.id.replace('_', ''));

  // Enter any new modes at the parent's previous position.
  const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', () => `translate(${source.y0}, ${source.x0})`)
      .on('click', click);

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr('dy', '.35em')
      .attr('x', () => 6)
      .text(d => d.data.name)
      .each(function(d) { d.width = Math.max(32, this.getComputedTextLength() + 12); });

  nodeEnter.insert('rect', 'text')
      .attr('ry', 6)
      .attr('rx', 6)
      .attr('y', -10)
      .attr('height', 20)
      .attr('width', d => d.width)

  // UPDATE
  const nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr('transform', d => `translate(${d.y}, ${d.x})`);


  // Remove any exiting nodes
  const nodeExit = node.exit()
      .transition()
      .duration(duration)
      .attr('transform', () => `translate(${source.y}, ${source.x})`)
      .remove();

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);


  // ****************** links section ***************************

  // Update the links...
  const link = svg.selectAll('path.link')
      .data(links, d => d.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', d => {
        const o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  const linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', d => diagonal(d, d.parent));

  // Remove any exiting links
  const linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', d => {
        const o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {

  return `M ${d.y} ${d.x}
          C ${(s.y + d.y) / 2} ${d.x},
            ${(s.y + d.y) / 2} ${s.x},
            ${s.y} ${s.x}`;
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}
