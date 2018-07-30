import * as d3 from 'd3';

const spinnerSvg: d3.Selection<Element, any, HTMLElement, any> = d3.select('#spinner');
const outerCircle = d3.select('#spinner-outer-circle');
const innerCircle = d3.select('#spinner-inner-circle');

const animation = d3.timer(elapsed => {
  const angle = 116 + (elapsed / 4);
  outerCircle.attr('transform', `rotate(${angle} 50 50)`);
  innerCircle.attr('transform', `rotate(${-angle} 50 50)`);
});

const animationTime = 300;

export const spinner = {
  config(width, height) {
    spinnerSvg
      .style('opacity', 0)
      .attr('width', width)
      .attr('height', height);
  },

  start() {
    spinnerSvg
      .transition()
      .duration(animationTime)
      .ease(d3.easeLinear)
      .style('opacity', 1);
  },

  stop() {
    spinnerSvg
      .transition()
      .duration(animationTime)
      .ease(d3.easeLinear)
      .style('opacity', 0);

    setTimeout(() => {
      animation.stop();
      spinnerSvg.style('display', 'none');
    }, animationTime);
  }
};
