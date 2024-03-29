import { initProvenance, NodeID, createAction } from '@visdesignlab/trrack';
import '../styles/styles.css'
import { ProvVisCreator } from '@visdesignlab/trrack-vis';
import * as d3 from "d3";
import baseNodes from '.././data/nodes'
import baseLinks from '.././data/links'
import getLinkColor from "../utils/getLinkColor"
import getNodeColor from "../utils/getNodeColor"
import getTextColor from "../utils/getTextColor"
import getNeighbors from "../utils/getNeighbors"
import resetNodeColor from "../utils/resetNodeColor";
import resetTextColor from "../utils/resetTextColor";
import resetLinkColor from "../utils/resetLinkColor";

/*******************************************PROVENANCE GRAPH*********************************************************/
/*
 * interface representing the state of the application
 */
export interface NodeState {
    selectedNode: string;
    hoveredNode: string;
    draggedNode: string;
    addNode: string;
}

/*
 * Initial state
 */
const initialState: NodeState = {
    selectedNode: 'none',
    hoveredNode: 'none',
    draggedNode: 'none',
    addNode: 'none'
};

// events the provenance tracking will record
type EventTypes = 'Select Node' | 'Hover Node' | 'Drag Node' | 'Add Node';

// initialize provenance with the first state
let prov = initProvenance<NodeState, EventTypes, string>(initialState, {
    loadFromUrl: false,
});

/*
 * Function called when a node is selected. Applies an action to provenance.
 * Set up apply action functions for each of the 2 actions that affect state
 */
const nodeSelectAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newSelected: string) => {
        state.selectedNode = newSelected;
    },
);
const selectNodeUpdate = function (newSelected: string) {
    console.log("Provenance.ts select node update");
    nodeSelectAction.setLabel(`${newSelected} Selected`).setEventType('Select Node');
    prov.apply(nodeSelectAction(newSelected));
};

/*
 * Drag node function
 */
const nodeDragAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newDragged: string) => {
        state.draggedNode = newDragged;
        console.log("Inside node Drag Actions")
    },
)
const dragNodeUpdate = function (newDragged: string) {
    console.log("Inside drag Node update")

    nodeDragAction.setLabel(`${newDragged} Moved`).setEventType('Drag Node');
    prov.apply(nodeDragAction(newDragged));
}

/*
 * Add a node function
 */
const addNodeAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newNode: string) => {
        state.addNode = newNode;
        console.log("In addNodeAction");
        return state;
    },
);
const newNodeUpdate = function (newNode: string) {
    addNodeAction.setLabel(`${newNode} added`).setEventType('Add Node');
    prov.apply(addNodeAction(newNode));
}

/*
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

// Create function to pass to the ProvVis library for when a node is selected in the graph.
// For our purposes, were simply going to jump to the selected node.
const visCallback = function (newNode: NodeID) {
    prov.goToNode(newNode);
};

/*
 * Observer for when the selected node state is changed.
 * Calls selectNode in scatterplot to update vis.
 */
prov.addObserver(
    (state) => state.selectedNode,
    () => {
        console.log("Provenance graph: select node observer.");
        selectNodeStyle(prov.getState(prov.current).selectedNode)
    },
);

prov.addObserver(
    (state) => state.draggedNode,
    () => {
        console.log("Provenance graph drag node observer");
        dragNodeStyle(prov.getState(prov.current).draggedNode)
    },
);

prov.addObserver(
    (state) => state.addNode,
    () => {
        console.log("Provenance graph: select add node observer.");
        addNodeStyle(prov.getState(prov.current).addNode)
    },
);

/**
 * Observer for when the hovered node state is changed. Calls hoverNode in scatterplot to update vis.
 *
prov.addObserver(
    (state) => state.hoveredNode,
    () => {
        console.log("Provenance.ts hover node observer");
        graph.hoverNode(prov.getState(prov.current).hoveredNode);
    },
);*/


prov.done();

// Setup ProvVis once initially use ID found in the index.html file 'provDiv'
// this is the provenance tree graph
ProvVisCreator(document.getElementById('provDiv')!, prov, visCallback);

// Undo function which simply goes one step backwards in the graph.
function undo() {
    console.log("User clicked undo");
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
    console.log("User clicked redo");
    const mac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

    if (!e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
        undo();
    }
    else if (e.shiftKey && (mac ? e.metaKey : e.ctrlKey) && e.which === 90) {
        redo();
    }
};


/***************************************************** BUTTONS *****************************************************************/

const addNodeButton = document.getElementById('addNode');

addNodeButton?.addEventListener('click', function handleClick(event) {
    console.log('adding a node button clicked');

    // node data
    var newLabel = prompt("Enter the name of the new node.");

    // if newlabel is empty the user clicked 'Ok' without typing text 
    // if newLabel is null the user selected cancel
    if (newLabel == "" || newLabel == null) {
        console.log("User selected cancel to adding a new node or user did not input text");
    }

    else {

        // display to user
        var message = "Please type the node(s) you wish to attach the new node to. If you chose to enter more than one node leave a space inbetween node names. This is case sensitive and spelling matters.";

        // record users response
        var response = prompt(message);

        // empty string means user selected cancel
        if (response == "" || response == null) {
            console.log("user selected cancel");
        }

        else {

            // establish node information if the user has entered valid data
            var newNumId    = parseInt(nodes[nodes.length - 1].id) + 1;         // increment last existing id by 1
            var newId       = newNumId.toString();                              // convert numeric id to string
            var newNode     = {
                id: newId,
                group: nodes[nodes.length - 1].group,
                label: newLabel,
                level: nodes[nodes.length - 1].level,
            }
            nodes.push(newNode);

            // this generates the ndoe
            updateSimulation();

            newNodeUpdate(`${newNode.label}`);

            // parse the users response
            var parser = response.split(" ");

            // iterates through the list of nodes
            for (var node of nodes) {

                // iterates through the users response
                for (var nodeName of parser) {

                    // if the name matches the users input establish a new link
                    if (nodeName == node.label) {

                        // establish the new link also dont waste hours just use the ID 
                        var newLink = { target: node.id, source: newNode.id, strength: 0.5 };
                        links.push(newLink);

                        updateSimulation();
                    }
                }
            }
        }
    }
});


/********************************************************** HEADER **********************************************************************/

/*
let c: HTMLCanvasElement = document.getElementById("myCanvas") as HTMLCanvasElement;
var ctx = c.getContext("2d");
var mask;

var pointCount = 1000;
var str = "Provenance Tracking";
var fontStr = "bold 128pt Helvetica Neue, Helvetica, Arial, sans-serif";

ctx.font = fontStr;
ctx.textAlign = "center";
c.width = ctx.measureText(str).width;
c.height = 128; // Set to font size

var whitePixels = [];
var points = [];
var point = function (x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx || 1;
    this.vy = vy || 1;
}
point.prototype.update = function () {
    ctx.beginPath();
    ctx.fillStyle = "#95a5a6";
    ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    // Change direction if running into black pixel
    if (this.x + this.vx >= c.width || this.x + this.vx < 0 || mask.data[coordsToI(this.x + this.vx, this.y, mask.width)] != 255) {
        this.vx *= -1;
        this.x += this.vx * 2;
    }
    if (this.y + this.vy >= c.height || this.y + this.vy < 0 || mask.data[coordsToI(this.x, this.y + this.vy, mask.width)] != 255) {
        this.vy *= -1;
        this.y += this.vy * 2;
    }

    for (var k = 0, m = points.length; k < m; k++) {
        if (points[k] === this) continue;

        var d = Math.sqrt(Math.pow(this.x - points[k].x, 2) + Math.pow(this.y - points[k].y, 2));
        if (d < 5) {
            ctx.lineWidth = .2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(points[k].x, points[k].y);
            ctx.stroke();
        }
        if (d < 20) {
            ctx.lineWidth = .1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(points[k].x, points[k].y);
            ctx.stroke();
        }
    }

    this.x += this.vx;
    this.y += this.vy;
}

function loop() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (var k = 0, m = points.length; k < m; k++) {
        points[k].update();
    }
}

function init() {
    // Draw text
    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.rect(0, 0, c.width, c.height);
    ctx.fill();
    ctx.font = fontStr;
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.fillText(str, 0, c.height / 2 + (c.height / 2));
    ctx.closePath();

    // Save mask
    mask = ctx.getImageData(0, 0, c.width, c.height);

    // Draw background
    ctx.clearRect(0, 0, c.width, c.height);

    // Save all white pixels in an array
    for (var i = 0; i < mask.data.length; i += 4) {
        if (mask.data[i] == 255 && mask.data[i + 1] == 255 && mask.data[i + 2] == 255 && mask.data[i + 3] == 255) {
            whitePixels.push([iToX(i, mask.width), iToY(i, mask.width)]);
        }
    }

    for (var k = 0; k < pointCount; k++) {
        addPoint();
    }
}

function addPoint() {
    var spawn = whitePixels[Math.floor(Math.random() * whitePixels.length)];

    var p = new point(spawn[0], spawn[1], Math.floor(Math.random() * 2 - 1), Math.floor(Math.random() * 2 - 1));
    points.push(p);
}

function iToX(i, w) {
    return ((i % (4 * w)) / 4);
}
function iToY(i, w) {
    return (Math.floor(i / (4 * w)));
}
function coordsToI(x, y, w) {
    return ((mask.width * y) + x) * 4;

}

setInterval(loop, 10);
init();*/


/*****************************************************NODE BASED GRAPH*****************************************************************/
let nodes = [...baseNodes]                              // list of node data
let links = [...baseLinks]                              // list of link data
let zoom = d3.zoom().on("zoom", zoomy)                  // zoom functionality
var width = window.innerWidth                           // window width
var height = window.innerHeight                         // window height
var linkElements, nodeElements, textElements            // graph elements required
var selectedId                                          // this references to select/deselect after clicking the same element twice
var draggedId                                           // id to keep track of the current dragged node

/*
 * Graph Generation
 */
var svg = d3.select('#graph').append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom)
    .style('fill', 'white')
    .append("g");

// we use svg groups to logically group the elements together
var linkGroup = svg.append('g').attr('class', 'links')
var nodeGroup = svg.append('g').attr('class', 'nodes')
var textGroup = svg.append('g').attr('class', 'texts')

// generates the links and their force
var linkForce = d3
    .forceLink()
    .id(function (link) { return link.id })
    .strength(function (link) { return link.strength });

// generates the simulation connecting nodes and links
var simulation = d3
    .forceSimulation()
    .force('link', linkForce)
    .force('charge', d3.forceManyBody().strength(-240))
    .force('center', d3.forceCenter(width / 2, height / 2));

/*  
 * Drag functionality
 */
var dragDrop = d3.drag().on('start', function (event, node) {

    console.log("Drag on start");
    // this line of code ensures the graph does not move at all after a node has been moved
    //simulation.force("link", null).force("charge", null).force("center", null);
    node.fx = node.x
    node.fy = node.y

}).on('drag', function (event, node) {

    console.log("Drag on drag");
    // this line of code ensures the graph does not move at all after a node has been moved
    //simulation.force("link", null).force("charge", null).force("center", null);
    node.fx = event.x
    node.fy = event.y

}).on('end', function (event, node) {

    console.log("Drag on end");
    if (!event.active) {

        // this line of code ensures the graph does not move at all after a node has been moved
        //simulation.force("link", null).force("charge", null).force("center", null);
    }

    node.fx = event.x
    node.fy = event.y
    console.log("calling dragNode")
    dragNode('end', node)

});

// CHECK: this is used for the HTML 
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

/*
 * Zoom functionality
 */
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

/*
 * Select Node Functionality
 */ 
// select node is called on every click
// we either update the data according to the selection
// or reset the data if the same node is clicked twice
function selectNode(event, selectedNode) {
    console.log("Provenance.ts user selected a node." + `node_${selectedNode.id}`);

    if (selectedId === selectedNode.id) {
        console.log("User is deselecting a node");
        selectedId = undefined

        // when user deselects a node and the data is reset but the node drifts off
        resetData()
        updateSimulation()
    }
    else {
        console.log("User is selecting a new node");
        selectNodeUpdate(`node_${selectedNode.id}`)
        selectedId = selectedNode.id
        var neighbors = getNeighbors(selectedNode, baseLinks)

        // we modify the styles to highlight selected nodes
        nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, selectedNode) })
        textElements.attr('fill', function (node) { return getTextColor(node, neighbors, selectedNode) })
        linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
    }
}

/*
 * Get node by ID this function worries me it needs to be analyzed better
 */ 
function getNodeById(nodeId) {
    console.log("Provenance.ts getNode by ID ");
    var node = baseNodes.filter(function (node) {
        return node.id == nodeId;
    })
    // This may need to be changed this sometimes returns undefined 
    return node[0];
}


function selectNodeStyle(selectedNodeStr) {
    console.log("Provenance.ts selectNodeStyle().");

    let selectedNodeId = selectedNodeStr.split("_")[1];
    console.log("Provenance.ts selected node ID: " + selectedNodeId);

    let selectedNode = getNodeById(selectedNodeId);
    console.log("Provenance.ts selected node ID: " + selectedNode);

    if (selectedNode == undefined) {
        console.log("Provenance.ts selected node is undefined.");
        selectedId = undefined
        resetData()
    }

    else if (selectedId != selectedNode.id) {
        console.log("Provenance.ts selected node exists.");
        selectedId = selectedNode.id;
        // removed updateSimulation to maintain the entire graph

        // collect neighbors of the selected node
        var neighbors = getNeighbors(selectedNode, baseLinks)

        nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, selectedNode) })
        textElements.attr('fill', function (node) { return getTextColor(node, neighbors, selectedNode) })
        linkElements.attr('stroke', function (link) { return getLinkColor(selectedNode, link) })
    }
}

/* 
 * Drag Functionality
 */

// drag node should be called on every drag
// we should update the data while it is being dragged
// and update the provenance when the drag is finished
function dragNode(event, draggedNode) {
    console.log("Provenance.ts user finished dragging a node." + `node_${draggedNode.id}`);
    dragNodeUpdate(`node_${draggedNode.id}`)
}

function dragNodeStyle(draggedNodeStr) {
    console.log("Provenance.ts drag node by style");
    console.log(draggedNodeStr);

    let draggedNodeId = draggedNodeStr.split("_")[1];
    let draggedNode = getNodeById(draggedNodeId);

    console.log(draggedNode);

    if (draggedNode == undefined) {
        selectedId = undefined
        resetData()
    }
    else if (draggedId != draggedNode.id) {

        draggedId = draggedNode.id;
 
        // removed updateSimulation to maintain the entire graph
        var neighbors = getNeighbors(draggedNode, baseLinks)

        nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, draggedNode) })
        textElements.attr('fill', function (node) { return getTextColor(node, neighbors, draggedNode) })
        linkElements.attr('stroke', function (link) { return getLinkColor(draggedNode, link) })
    }
}


function addNodeStyle(addNodeStr) {
    console.log("Provenance.ts add node by style");
    console.log(addNodeStr);

    let addNodeId = addNodeStr.split("_")[1];
    let addNode = getNodeById(addNodeId);

    if (addNode == undefined) {
        selectedId = undefined
        resetData()
    }
    else if (addNodeId != addNode.id) {

        addNodeId = addNode.id;

        // removed updateSimulation to maintain the entire graph
        var neighbors = getNeighbors(addNode, baseLinks)

        nodeElements.attr('fill', function (node) { return getNodeColor(node, neighbors, addNode) })
        textElements.attr('fill', function (node) { return getTextColor(node, neighbors, addNode) })
        linkElements.attr('stroke', function (link) { return getLinkColor(addNode, link) })
    }
}


// this helper simple adds all nodes and links
// that are missing, to recreate the initial state
function resetData() {
    console.log("Provenance.ts reset Data.")

    // collect all node id's 
    var nodeIds = nodes.map(function (node) { return node.id })

    baseNodes.forEach(function (node) {

        if (nodeIds.indexOf(node.id) === -1) {

            console.log("Pushing nodes " + node.id);
            nodes.push(node)
        }

        nodeElements.attr('fill', function (node) { return resetNodeColor(node) })
        textElements.attr('fill', function (node) { return resetTextColor(node) })
        linkElements.attr('stroke', function (link) { return resetLinkColor(node) })
    })
}

function updateGraph() {
    console.log("Provenance.ts update graph");

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
    console.log("Provenance.ts update simulation");
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

    // creates links for graph
    simulation.force('link').links(links);

    // allows nodes to be dragged setting to zero makes graph static but lose drag capabilities
    // DEBUG: when set to zero we lost drag functionality
    simulation.alphaTarget(0.1).restart();
}

// we call updateSimulation to trigger the initial render without the graph will not load
updateSimulation()
window.zoomIn = zoomIn
window.zoomOut = zoomOut
window.resetZoom = resetZoom
window.center = center
