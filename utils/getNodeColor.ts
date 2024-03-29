export default function getNodeColor(node, neighbors, selectedNode) {
    if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
        if (node === selectedNode) {
            return 'blue';
        }
        return node.level === 1 ? 'blue' : '#1BB47F'
    }

    return node.level === 1 ? 'red' : 'gray'
}