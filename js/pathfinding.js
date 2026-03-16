// pathfinding.js - Dijkstra pathfinding on the corridor waypoint graph

import { POSITIONS } from './game.js';

let _graph = null;

// Build bidirectional adjacency list from WAYPOINT_EDGES
function buildGraph() {
    const graph = new Map();

    for (const wp of POSITIONS.WAYPOINTS) {
        graph.set(wp.id, []);
    }

    for (const [a, b] of POSITIONS.WAYPOINT_EDGES) {
        const wpA = POSITIONS.WAYPOINTS.find(w => w.id === a);
        const wpB = POSITIONS.WAYPOINTS.find(w => w.id === b);
        if (!wpA || !wpB) continue;
        const dist = Math.hypot(wpB.x - wpA.x, wpB.y - wpA.y);
        graph.get(a).push({ id: b, dist });
        graph.get(b).push({ id: a, dist });
    }

    return graph;
}

function getGraph() {
    if (!_graph) _graph = buildGraph();
    return _graph;
}

// Returns the id of the waypoint nearest to (x, y)
export function nearestWaypointId(x, y) {
    let best = null, bestDist = Infinity;
    for (const wp of POSITIONS.WAYPOINTS) {
        const d = Math.hypot(wp.x - x, wp.y - y);
        if (d < bestDist) { bestDist = d; best = wp.id; }
    }
    return best;
}

function waypointById(id) {
    return POSITIONS.WAYPOINTS.find(w => w.id === id);
}

// Dijkstra from startId to endId — returns array of {x, y} waypoints
function dijkstra(startId, endId) {
    const graph = getGraph();
    const dist = new Map();
    const prev = new Map();
    const unvisited = new Set();

    for (const id of graph.keys()) {
        dist.set(id, Infinity);
        unvisited.add(id);
    }
    dist.set(startId, 0);

    while (unvisited.size > 0) {
        // Pick unvisited node with smallest distance
        let u = null, minD = Infinity;
        for (const id of unvisited) {
            if (dist.get(id) < minD) { minD = dist.get(id); u = id; }
        }
        if (u === null || u === endId) break;
        unvisited.delete(u);

        for (const { id: v, dist: edgeDist } of graph.get(u)) {
            if (!unvisited.has(v)) continue;
            const alt = dist.get(u) + edgeDist;
            if (alt < dist.get(v)) {
                dist.set(v, alt);
                prev.set(v, u);
            }
        }
    }

    // Reconstruct path (end → start, then reverse)
    const path = [];
    let u = endId;
    while (prev.has(u)) {
        const wp = waypointById(u);
        if (wp) path.unshift({ x: wp.x, y: wp.y });
        u = prev.get(u);
    }
    const startWp = waypointById(u);
    if (startWp) path.unshift({ x: startWp.x, y: startWp.y });

    return path;
}

// Navigate from current position to a specific waypoint id
// The robot first goes to its nearest waypoint, then follows the graph
export function findPath(startX, startY, targetWaypointId) {
    const startId = nearestWaypointId(startX, startY);

    if (startId === targetWaypointId) {
        const wp = waypointById(targetWaypointId);
        return wp ? [{ x: wp.x, y: wp.y }] : [];
    }

    return dijkstra(startId, targetWaypointId);
}
