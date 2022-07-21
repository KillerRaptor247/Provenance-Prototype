import * as d3 from 'd3'
import baseLinks from '.././data/links'
import getLinkColor from "../utils/getLinkColor"
import getNodeColor from "../utils/getNodeColor"
import getTextColor from "../utils/getTextColor"
import getNeighbors from "../utils/getNeighbors"

export class Plot {
    margin: any;
    width: number;
    height: number;
    quartetNum: string;
    data: any[];
    svg: d3.Selection<SVGSVGElement, any, HTMLElement, any>;
    xScale: d3.ScaleLinear<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    selectNodeFunc: (s: string) => void;

    constructor(

        // functionality the provenance graph records
        selectNodeFunc: (s: string) => void,
        hoverNodeFunc: (s: string)  => void,
    ) {
        this.margin         = {};
        this.width          = 0;
        this.height         = 0;
        this.data           = [];
        this.svg            = d3.select('#graph').append('svg');
        this.xScale         = d3.scaleLinear();
        this.yScale         = d3.scaleLinear();
        this.selectNodeFunc = selectNodeFunc;

        // where the JSON data is stored
        d3.json('https://demo6704570.mockable.io/ptracking').
            then((d) => {
                this.data   = d;
                this.margin = {top: 20, right: 20, bottom: 20, left: 20,};
                this.width  = 800 - this.margin.left - this.margin.right;
                this.height = 800 - this.margin.top - this.margin.bottom;
                this.xScale.range([50, 750]);
                this.yScale.range([50, 750]);
                this.initializeVis(selectNodeFunc, hoverNodeFunc);
            });
    }

    // NEED: for generating provenance tree graph
    initializeVis(selectNodeFunc: (s: string) => void, hoverNodeFunc: (s: string) => void) {

        console.log("Graph.ts initialize data");

        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        // DEBUG: Non static initial render due to this. this ensures the provenance graph shows the data recorded 
        const currData = this.data.filter((d) => d.dataset === this.quartetNum);

        this.svg.selectAll('circle')
            .data(currData)
            .enter()
            .append('circle')
            .attr('class', 'normalNode')
            .attr('id', (d) => `node_${d.id}`)
            .attr('cx', (d) => this.xScale(+d.x))
            .attr('cy', (d) => this.height - this.yScale(+d.y))
            .attr('r', 7)
            .on('click', (d) => selectNodeFunc(`node_${d.id}`))
            .on('mouseover', (d) => hoverNodeFunc(`node_${d.id}`))
            .on('mouseout', (d) => hoverNodeFunc(''));
    }


    /*
     * Ensures the previously selected node is no longer selected
     * Selects the new node
     *
    selectNode(selectedNode: string) {

        // previous selected node is no longer selected thus set to false
        d3.select('.selectedNode')
            .classed('selectedNode', false)
            .attr('r', 7);

        // selected node is set to true
        d3.select(`#${selectedNode}`)
            .classed('selectedNode', true)
            .attr('r', 10);
    }

    /*
    * Ensures the previously hovered node is no longer hovered
    * If hoverNode is not empty, hovers the new node
    *
    hoverNode(hoverNode: string) {
        d3.select('.hoverNode')
            .classed('hoverNode', false);

        if (hoverNode !== '') {
            d3.select(`#${hoverNode}`)
                .classed('hoverNode', true);
        }
    }*/
}

var linkElements, nodeElements, textElements        // graph elements required

// NEED to export data
export default function selectNodeExplicit(selectedNode) {
    var neighbors = getNeighbors(selectedNode, baseLinks)

    // we modify the styles to highlight selected nodes
    nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, selectedNode) })
    textElements.attr('fill', function (node) { return getTextColor(node, neighbors, selectedNode) })
    linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
}


