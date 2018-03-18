import * as d3 from 'd3';

var flare = require('./flare.json');

var m = [20, 120, 20, 120],
    w = 1280 - m[1] - m[3],
    h = 800 - m[0] - m[2],
    i = 0,
    root;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    g = svg.append("g").attr("transform", "translate(40,0)");

var cluster = d3.cluster()
    .size([height, width - 160]);

var tree = d3.tree().size([h, w]);

var diagonal = d3.linkHorizontal()
                .x(function(d) { return d.y; })
                .y(function(d) { return d.x; });

// var svg = d3.select("#body").append("svg:svg")
//     .attr("width", w + m[1] + m[3])
//     .attr("height", h + m[0] + m[2])
//     .append("svg:g")
//     .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

d3.json("flare.json", function(json) {
  root = flare;
  root.x0 = h / 2;
  root.y0 = 0;

  function toggleAll(d) {
    if (d.children) {
      d.children.forEach(toggleAll);
      toggle(d);
    }
  }

  // Initialize the display to show a few nodes.
  root.children.forEach(toggleAll);
  toggle(root.children[1]);
  toggle(root.children[1].children[2]);
  toggle(root.children[9]);
  toggle(root.children[9].children[0]);

  update(root);
});

function update(source) {
  var duration = d3.event && d3.event.altKey ? 5000 : 500;

  var root = d3.hierarchy(source);
  tree(root);

  var link = g.selectAll(".link")
      .data(root.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + d.y + "," + d.x
            + "C" + (d.parent.y + 100) + "," + d.x
            + " " + (d.parent.y + 100) + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x;
      });

  var node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

  node.append("circle")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children ? -8 : 8; })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
        return d.data.name;
      });

  // // Compute the new tree layout.
  // var nodes = treeRoot.descendants().reverse();

  // // Normalize for fixed-depth.
  // nodes.forEach(function(d) { d.y = d.depth * 180; });

  // // Update the nodes…
  // var node = vis.selectAll("g.node")
  //     .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // // Enter any new nodes at the parent's previous position.
  // var nodeEnter = node.enter().append("svg:g")
  //     .attr("class", "node")
  //     .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
  //     .on("click", function(d) { toggle(d); update(d); });

  // nodeEnter.append("svg:circle")
  //     .attr("r", 1e-6)
  //     .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  // nodeEnter.append("svg:text")
  //     .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
  //     .attr("dy", ".35em")
  //     .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
  //     .text(function(d) { return d.name; })
  //     .style("fill-opacity", 1e-6);

  // // Transition nodes to their new position.
  // var nodeUpdate = node.transition()
  //     .duration(duration)
  //     .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  // nodeUpdate.select("circle")
  //     .attr("r", 4.5)
  //     .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  // nodeUpdate.select("text")
  //     .style("fill-opacity", 1);

  // // Transition exiting nodes to the parent's new position.
  // var nodeExit = node.exit().transition()
  //     .duration(duration)
  //     .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
  //     .remove();

  // nodeExit.select("circle")
  //     .attr("r", 1e-6);

  // nodeExit.select("text")
  //     .style("fill-opacity", 1e-6);

  // // Update the links…
  // var link = vis.selectAll("path.link")
  //     .data(tree.links(nodes), function(d) { return d.target.id; });

  // // Enter any new links at the parent's previous position.
  // link.enter().insert("svg:path", "g")
  //     .attr("class", "link")
  //     .attr("d", function(d) {
  //       var o = {x: source.x0, y: source.y0};
  //       return diagonal({source: o, target: o});
  //     })
  //   .transition()
  //     .duration(duration)
  //     .attr("d", diagonal);

  // // Transition links to their new position.
  // link.transition()
  //     .duration(duration)
  //     .attr("d", diagonal);

  // // Transition exiting nodes to the parent's new position.
  // link.exit().transition()
  //     .duration(duration)
  //     .attr("d", function(d) {
  //       var o = {x: source.x, y: source.y};
  //       return diagonal({source: o, target: o});
  //     })
  //     .remove();

  // // Stash the old positions for transition.
  // nodes.forEach(function(d) {
  //   d.x0 = d.x;
  //   d.y0 = d.y;
  // });
}

// Toggle children.
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}
