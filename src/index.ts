import * as d3 from 'd3';
import * as queryString from 'query-string';

import { Modal } from './modal';

const priority = {
  1: '#FFD700',
  2: '#FF8C00',
  3: '#87CEFA',
  4: '#90EE90',
}

var treeData = [];

// Set the dimensions and margins of the diagram
var margin = { top: 20, right: 90, bottom: 30, left: 90 },
  width = window.innerWidth - margin.left - margin.right,
  height = window.innerHeight - margin.top - margin.bottom - 70;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3
  .select('body')
  .append('svg')
  .attr('width', width + margin.right + margin.left)
  .attr('height', height + margin.top + margin.bottom)
  .call(d3.zoom().on("zoom", function () {
    svg.attr("transform", d3.event.transform)
  }))
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var i = 0,
  duration = 750,
  root,
  treemap,
  modal;

const parsedSearchParams = queryString.parse(location.search);

fetch('https://knowledge-roadmap-server.herokuapp.com/nodes')
.then((response) => {
  return response.json();
})
.then((json) => {
  treeData = json[parsedSearchParams.tree || 0];
  // declares a tree layout and assigns the size
  treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  root = d3.hierarchy(treeData, function(d) {
    return d.children;
  });
  root.x0 = height / 2;
  root.y0 = 0;

  modal = new Modal();

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
  var node = svg.selectAll('g.node').data(nodes, function(d) {
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
    .attr('x', () => 8)
    .text(function(d) {
      return d.data.name;
    })
    .each(function(d) {
      d.width = Math.max(30, this.getComputedTextLength() + 16);
    });

  nodeEnter
    .insert('rect', 'text')
    .attr('ry', 6)
    .attr('rx', 6)
    .attr('y', -10)
    .attr('fill', function(d) {
      return priority[d.data.priority || 1];
    })
    .attr('height', 25)
    .attr('width', function(d) {
      return d.width;
    });

  // Add coment flag if necessary
  modal.appendModalFlag(node);

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Update the flag
  modal.updateFlag(svg, nodes, i);

  // Transition to the proper position for the node
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    });

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
  var link = svg.selectAll('path.link').data(links, function(d) {
    return d.id;
  });

  // Enter any new links at the parent's previous position.
  var linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function(d) {
      var o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      return diagonal(d, d.parent);
    });

  // Remove any exiting links
  var linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      var o = { x: source.x, y: source.y };
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
