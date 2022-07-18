import { createAction, initProvenance, NodeID } from '@visdesignlab/trrack';
import { ProvVisCreator } from '@visdesignlab/trrack-vis';
import * as d3 from "d3";
import baseLinks from '.././data/links';
// import * as d3 from 'd3'
import baseNodes from '.././data/nodes';
import '../styles/styles.css';
import getLinkColor from "../utils/getLinkColor";
import getNeighbors from "../utils/getNeighbors";
import getNodeColor from "../utils/getNodeColor";
import getTextColor from "../utils/getTextColor";
import resetLinkColor from "../utils/resetLinkColor";
import resetNodeColor from "../utils/resetNodeColor";
import resetTextColor from "../utils/resetTextColor";
import { Plot } from './graph';


/**
 * interface representing the state of the application
 */
export interface NodeState {
    selectedNode: string;
    hoveredNode: string;
    // addNode: string;
}

/**
 * Initial state
 */
const initialState: NodeState = {
    selectedNode: 'none',
    hoveredNode: 'none',
    //addNode: 'none'
};

type EventTypes = 'Select Node' | 'Hover Node' /*| 'Add Node'*/;

// initialize provenance with the first state
let prov = initProvenance<NodeState, EventTypes, string>(initialState, {
    loadFromUrl: false,
});

// Set up apply action functions for each of the 2 actions that affect state

/**
 * Function called when a node is selected. Applies an action to provenance.
 */
const nodeSelectAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newSelected: string) => {
        state.selectedNode = newSelected;
    },
);

const selectNodeUpdate = function (newSelected: string) {
    console.log("INSIDE SELECT NODE");
    nodeSelectAction.setLabel(`${newSelected} Selected`).setEventType('Select Node');
    prov.apply(nodeSelectAction(newSelected));
};

/*
const addNodeAction = createAction<NodeState, any, EventTypes > (
    (state: NodeState, addNode: string) => {
        state.addNode = addNode;
    },
);

const addNodeUpdate = function(addNode: )*/

/**
 * Function called when a node is hovered. Applies an action to provenance.
 */

const hoverAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newHover: string) => {
        state.hoveredNode = newHover;
        return state;
    },
);

const hoverNodeUpdate = function (newHover: string) {
    hoverAction
        .setLabel(newHover === '' ? 'Hover Removed' : `${newHover} Hovered`)
        .setEventType('Hover Node');

    prov.apply(hoverAction(newHover));
};

// Create our scatterplot class which handles the actual vis. Pass it our three action functions
// so it can use them when appropriate.

const graph = new Plot(selectNodeUpdate, hoverNodeUpdate);

// Create function to pass to the ProvVis library for when a node is selected in the graph.
// For our purposes, were simply going to jump to the selected node.
const visCallback = function (newNode: NodeID) {
    prov.goToNode(newNode);
};

// Set up observers for the three keys in state. These observers will get called either when
// an applyAction function changes the associated keys value.

// Also will be called when an internal graph change such as goBackNSteps, goBackOneStep or goToNode
// change the keys value.

/**
 * Observer for when the quartet state is changed. Calls changeQuartet in scatterplot to update vis.
 * 
/**
 * Observer for when the selected node state is changed.
 * Calls selectNode in scatterplot to update vis.
 */
prov.addObserver(
    (state) => state.selectedNode,
    () => {
        // This works as well
        // selectNodeStyle(prov.getState(prov.current).selectedNode)
        console.log("INSIDE SELECT NODE OBSERVER");
        selectNodeStyle(prov.getState(prov.current).selectedNode)
        // graph.selectNode(prov.getState(prov.current).selectedNode);
    },
);

/**
 * Observer for when the hovered node state is changed. Calls hoverNode in scatterplot to update vis.
 */
prov.addObserver(
    (state) => state.hoveredNode,
    () => {
        console.log("INSIDE SELECT NODE HOVER");
        graph.hoverNode(prov.getState(prov.current).hoveredNode);
    },
);

prov.done();

// Setup ProvVis once initially
ProvVisCreator(document.getElementById('provDiv')!, prov, visCallback);

// Undo function which simply goes one step backwards in the graph.
function undo() {
    prov.goBackOneStep();
}

// Redo function which traverses down the tree one step.
function redo() {
    if (prov.current.children.length === 0) {
        return;
    }
    prov.goForwardOneStep();
}

// Setting up undo/redo hotkey to typical buttons
document.onkeydown = function (e) {
    const mac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

    if (!e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
        undo();
    } else if (e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
        redo();
    }
};


/// CODE

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
    console.log(`node_${selectedNode.id}`);

    if (selectedId === selectedNode.id) {
        selectedId = undefined
        resetData()
        updateSimulation()
    } else {
        selectNodeUpdate(selectedNode.label)
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

// we want the dragged node function to be called when the node
// is finished dragging not at the start
function draggedNode(event, draggedNode) {
    if (selectedId === draggedNode.id) {

    }
}

function getNodeById(nodeId) {
    var node = baseNodes.filter(function (node) {
        return node.id == nodeId
    })
    return node[0];
}

function selectNodeStyle(selectedNodeStr) {

    console.log("selectNode");
    console.log(selectedNodeStr);
    let selectedNodeId = selectedNodeStr.split("_")[1];
    let selectedNode = getNodeById(selectedNodeId);
    console.log(selectedNode);

    if (selectedNode == undefined) {
        selectedId = undefined
        resetData()
        updateSimulation()
    } else if (selectedId != selectedNode.id) {
        selectedId = selectedNode.id;

        updateData(selectedNode)
        updateSimulation()

        var neighbors = getNeighbors(selectedNode, baseLinks)

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
        // searchNodes.pop();
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
updateSimulation()
window.zoomIn = zoomIn
window.zoomOut = zoomOut
window.resetZoom = resetZoom
window.center = center
