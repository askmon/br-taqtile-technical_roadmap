import * as d3 from 'd3';

export const priority = {
  1: '#ffdf71',
  2: '#ffc374',
  3: '#83bbe5',
  4: '#a3d977',
}

const descriptions = {
  1: 'Should have a solid knowledge',
  2: 'Should be familiar with',
  3: 'Recommended to know',
  4: 'Nice to know',
}

const appendContent = (tooltipContent, color, text) => {
  tooltipContent
    .style('display', 'flex')
    .style('align-items', 'center')
    .append('div')
    .style('width', '20px')
    .style('height', '20px')
    .style('border-radius', '10px')
    .style('margin', '8px')
    .style('background-color', color);

  tooltipContent
    .append('p')
    .style('margin', '0')
    .style('color', 'white')
    .style('font-size', '12px')
    .text(text);
}
export const tooltip = {
  render() {
    d3.selectAll(".tooltip-content")
      .each(function(_d, i) { return appendContent(d3.select(this), priority[i + 1], descriptions[i + 1])});

    var tooltip = d3.select(".tooltip-box");

    d3.select(".tooltip-container")
      .on("mouseover", function(){return tooltip.style("visibility", "visible");})
      .on("mousemove", function(){return tooltip.style("top", "110px").style("right","25px");})
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
  }
}
