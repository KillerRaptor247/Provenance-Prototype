import * as d3 from 'd3'
import baseNodes from '.././data/nodes'
import baseLinks from '.././data/links'
import getLinkColor from "../utils/getLinkColor"
import getNodeColor from "../utils/getNodeColor"
import getTextColor from "../utils/getTextColor"
import getNeighbors from "../utils/getNeighbors"
import resetNodeColor from "../utils/resetNodeColor";
import resetTextColor from "../utils/resetTextColor";
import resetLinkColor from "../utils/resetLinkColor";


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
        selectNodeFunc: (s: string) => void,
        hoverNodeFunc: (s: string) => void,
    ) {
        this.margin = {};
        this.width = 0;
        this.height = 0;
        this.data = [];
        this.svg = d3.select('#mainDiv')
            .append('svg');
        this.xScale = d3.scaleLinear();
        this.yScale = d3.scaleLinear();
        this.selectNodeFunc = selectNodeFunc;

        // d3.json('http://localhost:8000/data/services.json').
        d3.json('https://demo6704570.mockable.io/ptracking').
            then((d) => {
                this.data = d;
                this.margin = {
                    top: 20, right: 20, bottom: 20, left: 20,
                };
                this.width = 800 - this.margin.left - this.margin.right;
                this.height = 800 - this.margin.top - this.margin.bottom;


                // this.xScale.domain([
                //     d3.min(this.data, (innerD) => +innerD.x)!,
                //     d3.max(this.data, (innerD) => +innerD.x)!,
                // ]);
                this.xScale.range([50, 750]);

                // this.yScale.domain([
                //     d3.min(this.data, (innerD) => +innerD.y)!,
                //     d3.max(this.data, (innerD) => +innerD.y)!,
                // ]);
                this.yScale.range([50, 750]);

                this.initializeVis(selectNodeFunc, hoverNodeFunc);
            });
    }

    initializeVis(selectNodeFunc: (s: string) => void, hoverNodeFunc: (s: string) => void) {
        this.svg
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom);

        console.log(this.data);
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


    /**
* Ensures the previously selected node is no longer selected
* Selects the new node
*/

    selectNode(selectedNode: string) {
        d3.select('.selectedNode')
            .classed('selectedNode', false)
            .attr('r', 7);

        d3.select(`#${selectedNode}`)
            .classed('selectedNode', true)
            .attr('r', 10);
    }

    /**
* Ensures the previously hovered node is no longer hovered
* If hoverNode is not empty, hovers the new node
*/

    hoverNode(hoverNode: string) {
        d3.select('.hoverNode')
            .classed('hoverNode', false);

        if (hoverNode !== '') {
            d3.select(`#${hoverNode}`)
                .classed('hoverNode', true);
        }
    }
}





let nodes = [...baseNodes]
let links = [...baseLinks]
let zoom = d3.zoom().on("zoom", zoomy)

var width = window.innerWidth
var height = window.innerHeight
let searchNodes = []
let searchLinks = []

var svg = d3.select('#graph').append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)
    .append("g")

var linkElements,
    nodeElements,
    textElements

// we use svg groups to logically group the elements together
var linkGroup = svg.append('g').attr('class', 'links')
var nodeGroup = svg.append('g').attr('class', 'nodes')
var textGroup = svg.append('g').attr('class', 'texts')

// we use this reference to select/deselect
// after clicking the same element twice
var selectedId

// simulation setup with all forces
var linkForce = d3
    .forceLink()
    .id(function (link) { return link.id })
    .strength(function (link) { return link.strength })

var simulation = d3
    .forceSimulation()
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-240))
    .force('center', d3.forceCenter(width / 2, height / 2))

var dragDrop = d3.drag().on('start', function (event, node) {
    node.fx = node.x
    node.fy = node.y
}).on('drag', function (event, node) {
    simulation.alphaTarget(0.7).restart()
    node.fx = event.x
    node.fy = event.y
}).on('end', function (event, node) {
    if (!event.active) {
        simulation.alphaTarget(0)
    }
    node.fx = event.x
    node.fy = event.y
})

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function zoomy(event) {
    svg.attr("transform", event.transform)
}

function zoomIn() {
    svg
        .transition()
        .call(zoom.scaleBy, 2);
}

function zoomOut() {
    svg
        .transition()
        .call(zoom.scaleBy, 0.5);
}

function resetZoom() {
    svg
        .transition()
        .call(zoom.scaleTo, 1);
}

function center() {
    svg
        .transition()
        .call(zoom.translateTo, 0.5 * width, 0.5 * height);
}

// select node is called on every click
// we either update the data according to the selection
// or reset the data if the same node is clicked twice
function selectNode(event, selectedNode) {
    console.log("MEEEE")
    // this.selectNodeFunc(`node_${d.id}`)
    // selectNodeFunc(`node_${1}`)
    if (selectedId === selectedNode.id) {
        selectedId = undefined
        resetData()
        updateSimulation()
    } else {
        selectedId = selectedNode.id
        updateData(selectedNode)
        updateSimulation()
        var neighbors = getNeighbors(selectedNode, baseLinks)

        // we modify the styles to highlight selected nodes
        nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, selectedNode) })
        textElements.attr('fill', function (node) { return getTextColor(node, neighbors, selectedNode) })
        linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
    }
}

export default function selectNodeExplicit(selectedNode) {
    selectedId = selectedNode.id
    updateData(selectedNode)
    updateSimulation()
    var neighbors = getNeighbors(selectedNode, baseLinks)

    // we modify the styles to highlight selected nodes
    nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, selectedNode) })
    textElements.attr('fill', function (node) { return getTextColor(node, neighbors, selectedNode) })
    linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
}

export function selectNodesExplicit(selectedNode) {
    selectedId = selectedNode.id

    var val;
    for (let i = 0; i < searchNodes.length; i++) {
        val = searchNodes.values().next().value
    }

    if (!(typeof val === undefined)) {
        searchNodes.push(selectedNode)
    }
    var diff = {
        removed: nodes.filter(function (node) { return searchNodes.indexOf(node) === -1 }),
        added: searchNodes.filter(function (node) { return nodes.indexOf(node) === -1 })
    }

    diff.removed.forEach(function (node) { nodes.splice(nodes.indexOf(node), 1) })
    diff.added.forEach(function (node) { nodes.push(node) })
}

export function selectLinksExplicit() {
    var newLinks = baseLinks.filter(function (link) {
        return (searchNodes.includes(link.source) && searchNodes.includes(link.target)) || searchNodes.length === 0
    })
    links = newLinks
    updateSimulation()
}

export function resetNodeExplicit() {
    nodeElements.attr('fill', 'gray')
    textElements.attr('fill', 'black')
    linkElements.attr('stroke', '#E5E5E5')
    resetData()
    updateSimulation()
}

// this helper simple adds all nodes and links
// that are missing, to recreate the initial state
function resetData() {
    var nodeIds = nodes.map(function (node) { return node.id })
    var neighbors = {}

    baseNodes.forEach(function (node) {
        if (nodeIds.indexOf(node.id) === -1) {
            nodes.push(node)
        }
        nodeElements.attr('fill', function (node) { return resetNodeColor(node) })
        textElements.attr('fill', function (node) { return resetTextColor(node) })
        linkElements.attr('stroke', function (link) { return resetLinkColor(node) })
    })

    links = baseLinks
    for (let i = 0; i < searchNodes.length; i++) {
        searchNodes.pop();
    }
}



// diffing and mutating the data
function updateData(selectedNode) {
    var neighbors = getNeighbors(selectedNode, baseLinks)
    var newNodes = baseNodes.filter(function (node) {
        return neighbors.indexOf(node.id) > -1 || node.level === 1
    })

    var diff = {
        removed: nodes.filter(function (node) { return newNodes.indexOf(node) === -1 }),
        added: newNodes.filter(function (node) { return nodes.indexOf(node) === -1 })
    }

    diff.removed.forEach(function (node) { nodes.splice(nodes.indexOf(node), 1) })
    diff.added.forEach(function (node) { nodes.push(node) })

    links = baseLinks.filter(function (link) {
        return link.target === selectedNode.id || link.source === selectedNode.id
    })
}

function updateGraph() {
    // links
    linkElements = linkGroup.selectAll('line')
        .data(links, function (link) {
            return link.target.id + link.source.id
        })

    linkElements.exit().remove()

    var linkEnter = linkElements
        .enter().append('line')
        .attr('stroke-width', 1)
        .attr('stroke', 'rgba(50, 50, 50, 0.2)')

    linkElements = linkEnter.merge(linkElements)

    // nodes
    nodeElements = nodeGroup.selectAll('circle')
        .data(nodes, function (node) { return node.id })

    nodeElements.exit().remove()

    var nodeEnter = nodeElements
        .enter()
        .append('circle')
        .attr('r', 10)
        .attr('fill', function (node) { return node.level === 1 ? 'red' : 'gray' })
        .call(dragDrop)
        // we link the selectNode method here
        // to update the graph on every click
        .on('click', selectNode)
        .on("mouseover", function (event, d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.id + "<br/>" + d.label)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (event, d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })

    nodeElements = nodeEnter.merge(nodeElements)

    // texts
    textElements = textGroup.selectAll('text')
        .data(nodes, function (node) { return node.id })

    textElements.exit().remove()

    var textEnter = textElements
        .enter()
        .append('text')
        .text(function (node) { return node.label })
        .attr('font-size', 15)
        .attr('dx', 15)
        .attr('dy', 4)

    textElements = textEnter.merge(textElements)
}

function updateSimulation() {
    updateGraph()

    simulation.nodes(nodes).on('tick', () => {
        nodeElements
            .attr('cx', function (node) { return node.x })
            .attr('cy', function (node) { return node.y })
        textElements
            .attr('x', function (node) { return node.x })
            .attr('y', function (node) { return node.y })
        linkElements
            .attr('x1', function (link) { return link.source.x })
            .attr('y1', function (link) { return link.source.y })
            .attr('x2', function (link) { return link.target.x })
            .attr('y2', function (link) { return link.target.y })
    })

    simulation.force('link').links(links)
    simulation.alphaTarget(0.7).restart()
}
// last but not least, we call updateSimulation
// to trigger the initial render
//initZoom();
// updateSimulation()
window.zoomIn = zoomIn
window.zoomOut = zoomOut
window.resetZoom = resetZoom
window.center = center


