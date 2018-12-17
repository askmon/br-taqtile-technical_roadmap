import * as d3 from 'd3';
import * as queryString from 'query-string';

import { Modal } from './modal';
import { spinner } from './spinner';
import { priority, tooltip } from './tooltip';

/**
 * Dis-comment this code to read the JSON from a local file instead of from
 * the API
 */
// var fs = require('fs');
// var json = JSON.parse(fs.readFileSync('db.json', 'utf8')).nodes;

var treeData = [];

const navBarHeight = 70;
const { innerWidth, innerHeight } = window

const height = innerHeight - navBarHeight;
const width = innerWidth;

// Set the dimensions and margins of the diagram
var margin = { top: innerHeight / 2 - navBarHeight, right: 90, bottom: 30, left: 90 };

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .call(d3.zoom().on("zoom", function () {
    let {x, y, k} = d3.event.transform;
    g.attr("transform", `translate(${x + margin.left},${y + margin.top}) scale(${k})`);
  }))
  .attr('height', height)

var g = svg
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

var i = 0,
  duration = 750,
  root,
  treemap,
  modal;

const parsedSearchParams = queryString.parse(location.search);

spinner.config(width, height);
spinner.start();

fetch('https://knowledge-roadmap-server.herokuapp.com/nodes')
.then((response) => {
  return response.json();
})
.then((json) => {
  spinner.stop();
  treeData = json[parsedSearchParams.tree || 0];
  // declares a tree layout and assigns the size
  treemap = d3.tree().nodeSize([60, 10]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) {
    return d.children;
  });
  root.x0 = 0;
  root.y0 = 0;

  modal = new Modal();
  tooltip.render();
  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);
});

// Collapse the node and all it's children
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
    links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) {
    d.y = d.depth * 200;
  });

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = g.selectAll('g.node').data(nodes, function(d) {
    return d.id || (d.id = ++i);
  });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function(d) {
      return 'translate(' + source.y0 + ',' + source.x0 + ')';
    })
    .on('click', click);

  // Add labels for the nodes
  nodeEnter
    .append('text')
    .attr('dy', '.5em')
    .attr('text-anchor', 'middle')
    .text(function(d) {
      return d.data.name;
    })
    .each(function(d) {
      d.width = Math.max(150, this.getComputedTextLength() + 16);
    })
    .attr('x', (d) => d.width / 2)
    .attr('cursor', (d) => (d._children || d.children) ? 'pointer' : 'default')
    ;


  nodeEnter
    .insert('rect', 'text')
    .attr('ry', 10)
    .attr('rx', 10)
    .attr('y', -16)
    .attr('fill', function(d) {
      return priority[d.data.priority || 1];
    })
    .attr('style', (d) => (d._children || d.children) ? '' : 'stroke-width:0.5px')
    .attr('cursor', (d) => {
      return (d._children || d.children) ? 'pointer' : 'default';
    })
    .attr('height', 36)
    .attr('width', function(d) {
      return d.width;
    });

  // Add coment flag if necessary
  modal.appendModalFlag(node);

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Update the flag
  modal.updateFlag(g, nodes, i);

  // Transition to the proper position for the node
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform',  d => `translate(${d.y},${d.x})`);

  // Update the node attributes and style
  nodeUpdate
    .select('circle.node')
    .attr('r', 10)
    .style('fill', function(d) {
      return d._children ? 'lightsteelblue' : '#fff';
    })
    .attr('cursor', 'pointer');

  // Remove any exiting nodes
  var nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + source.y + ',' + source.x + ')';
    })
    .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle').attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text').style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = g.selectAll('path.link').data(links, function(d) {
    return d.id;
  });

  // Enter any new links at the parent's previous position.
  var linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function(d) {
      var o = { x: source.x0, y: source.y0 + 50 };
      return diagonal(o, o);
    });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      var parent = { x: d.parent.x, y: d.parent.y + 50 };
      return diagonal(d, parent);
    });

  // Remove any exiting links
  var linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      var o = { x: source.x, y: source.y + 50 };
      return diagonal(o, o);
    })
    .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });

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
}
