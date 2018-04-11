import * as d3 from 'd3';
import { Datum, DatumType } from './models';
import { VerticalGraph } from './vertica-graph';

const roadmapData = require('./roadmap');

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

// declares a tree layout and assigns the size
const treemap = d3.tree<Datum>().size([height, width]);

// Assigns parent, children, height, depth
const root = d3.stratify<Datum>()(roadmapData.filter(i => i.type === DatumType.checkpoint));

const verticalGraph = new VerticalGraph(treemap, root, svg);

verticalGraph.build(height);
