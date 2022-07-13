import { initProvenance, NodeID, createAction } from '@visdesignlab/trrack';
import { ProvVisCreator } from '@visdesignlab/trrack-vis';
import Graph, { Plot } from './graph';

/**
 * interface representing the state of the application
 */
export interface NodeState {
    selectedNode: string;
    hoveredNode: string;
}

/**
 * Initial state
 */

const initialState: NodeState = {
    selectedNode: 'none',
    hoveredNode: 'none',
};

type EventTypes = 'Select Node' | 'Hover Node';

// initialize provenance with the first state
const prov = initProvenance<NodeState, EventTypes, string>(initialState, {
    loadFromUrl: false,
});

// Set up apply action functions for each of the 3 actions that affect state

/**
 * Function called when a node is selected. Applies an action to provenance.
 */

const nodeSelectAction = createAction<NodeState, any, EventTypes>(
    (state: NodeState, newSelected: string) => {
        state.selectedNode = newSelected;
    },
);

const selectNodeUpdate = function (newSelected: string) {
    nodeSelectAction.setLabel(`${newSelected} Selected`).setEventType('Select Node');

    prov.apply(nodeSelectAction(newSelected));
};

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
        graph.selectNode(prov.getState(prov.current).selectedNode);
    },
);

/**
 * Observer for when the hovered node state is changed. Calls hoverNode in scatterplot to update vis.
 */
prov.addObserver(
    (state) => state.hoveredNode,
    () => {
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