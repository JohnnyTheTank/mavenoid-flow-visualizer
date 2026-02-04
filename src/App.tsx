import { useState, useCallback, useMemo } from "react";
import { FileUploader } from "./components/FileUploader";
import { GraphView } from "./components/GraphView";
import { GraphControls } from "./components/GraphControls";
import { ViewToggle } from "./components/ViewToggle";
import { Sidebar } from "./components/Sidebar";
import { processFiles } from "./utils/parseFlows";
import { buildFlowGraph, buildOperationsGraph } from "./utils/buildGraph";
import type {
  ParsedData,
  Flow,
  GraphData,
  GraphSettings,
  GraphEdge,
} from "./types/flow";
import { DEFAULT_GRAPH_SETTINGS } from "./types/flow";

/**
 * Compute node degrees from edges
 */
function computeDegrees(edges: GraphEdge[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.data.source, (degrees.get(edge.data.source) || 0) + 1);
    degrees.set(edge.data.target, (degrees.get(edge.data.target) || 0) + 1);
  }
  return degrees;
}

/**
 * Get all connected nodes from a starting node using BFS
 */
function getConnectedNodes(
  startNodeId: string,
  edges: GraphEdge[]
): Set<string> {
  const connected = new Set<string>([startNodeId]);
  const queue = [startNodeId];

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.data.source)) {
      adjacency.set(edge.data.source, []);
    }
    if (!adjacency.has(edge.data.target)) {
      adjacency.set(edge.data.target, []);
    }
    adjacency.get(edge.data.source)!.push(edge.data.target);
    adjacency.get(edge.data.target)!.push(edge.data.source);
  }

  // BFS
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!connected.has(neighbor)) {
        connected.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return connected;
}

/**
 * Apply filters to graph data based on settings
 */
function applyFilters(
  graphData: GraphData,
  settings: GraphSettings,
  selectedNodeId: string | null
): GraphData {
  let { nodes, edges } = graphData;

  // Filter by kind
  nodes = nodes.filter((n) => {
    if (n.data.kind === "root" && !settings.showRoots) return false;
    if (n.data.kind === "component" && !settings.showComponents) return false;
    if (n.data.kind === "unknown" && !settings.showExternal) return false;
    return true;
  });

  // Get remaining node IDs
  let nodeIds = new Set(nodes.map((n) => n.data.id));

  // Filter edges to only include edges between remaining nodes
  edges = edges.filter(
    (e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
  );

  // Filter by connection count
  if (settings.minConnections > 0) {
    const degrees = computeDegrees(edges);
    nodes = nodes.filter(
      (n) => (degrees.get(n.data.id) || 0) >= settings.minConnections
    );
    nodeIds = new Set(nodes.map((n) => n.data.id));
    edges = edges.filter(
      (e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
    );
  }

  // Isolate selected node's connected component
  if (settings.isolateSelected && selectedNodeId && nodeIds.has(selectedNodeId)) {
    const connected = getConnectedNodes(selectedNodeId, edges);
    nodes = nodes.filter((n) => connected.has(n.data.id));
    nodeIds = new Set(nodes.map((n) => n.data.id));
    edges = edges.filter(
      (e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
    );
  }

  return { nodes, edges };
}

function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"flows" | "operations">("flows");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphSettings, setGraphSettings] = useState<GraphSettings>(DEFAULT_GRAPH_SETTINGS);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsLoading(true);
    try {
      const parsed = await processFiles(files);
      setData(parsed);
      setViewMode("flows");
      setSelectedNodeId(null);
      setSelectedFlow(null);
    } catch (error) {
      console.error("Failed to process files:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleDrillDown = useCallback(
    (flowId: string) => {
      if (!data) return;
      const flow = data.flows.get(flowId);
      if (flow) {
        setSelectedFlow(flow);
        setViewMode("operations");
        setSelectedNodeId(null);
      }
    },
    [data]
  );

  const handleBackToFlows = useCallback(() => {
    setViewMode("flows");
    setSelectedNodeId(selectedFlow?.id || null);
  }, [selectedFlow]);

  const handleViewChange = useCallback(
    (mode: "flows" | "operations") => {
      if (mode === "operations" && selectedNodeId && data) {
        const flow = data.flows.get(selectedNodeId);
        if (flow) {
          setSelectedFlow(flow);
          setViewMode("operations");
          setSelectedNodeId(null);
          return;
        }
      }
      setViewMode(mode);
    },
    [selectedNodeId, data]
  );

  // Build and filter graph data based on view mode and settings
  const graphData: GraphData | null = useMemo(() => {
    if (!data) return null;

    if (viewMode === "flows") {
      let fullGraph = buildFlowGraph(data);

      // Apply search filter first
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchingNodeIds = new Set(
          fullGraph.nodes
            .filter((n) => n.data.label.toLowerCase().includes(lowerSearch))
            .map((n) => n.data.id)
        );

        fullGraph = {
          nodes: fullGraph.nodes.filter((n) => matchingNodeIds.has(n.data.id)),
          edges: fullGraph.edges.filter(
            (e) =>
              matchingNodeIds.has(e.data.source) &&
              matchingNodeIds.has(e.data.target)
          ),
        };
      }

      // Apply settings-based filters
      return applyFilters(fullGraph, graphSettings, selectedNodeId);
    }

    if (selectedFlow) {
      return buildOperationsGraph(selectedFlow);
    }

    return null;
  }, [data, viewMode, selectedFlow, searchTerm, graphSettings, selectedNodeId]);

  const stats = useMemo(() => {
    if (!data) return null;
    const rootFlows = Array.from(data.flows.values()).filter(
      (f) => f.kind === "root"
    );
    const componentFlows = Array.from(data.flows.values()).filter(
      (f) => f.kind === "component"
    );
    return {
      total: data.flows.size,
      roots: rootFlows.length,
      components: componentFlows.length,
      references: data.references.length,
    };
  }, [data]);

  // Count currently visible nodes/edges for stats
  const visibleStats = useMemo(() => {
    if (!graphData) return null;
    return {
      nodes: graphData.nodes.length,
      edges: graphData.edges.length,
    };
  }, [graphData]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Mavenoid Flow Visualizer
          </h1>
          {data && (
            <div className="flex items-center gap-4">
              {viewMode === "flows" && (
                <input
                  type="text"
                  placeholder="Search flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              )}
              <ViewToggle
                viewMode={viewMode}
                onViewChange={handleViewChange}
                selectedFlowName={selectedFlow?.name}
                onBackToFlows={viewMode === "operations" ? handleBackToFlows : undefined}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {!data ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <FileUploader
                onFilesSelected={handleFilesSelected}
                isLoading={isLoading}
              />
              <p className="text-center text-sm text-gray-500 mt-4">
                Drop a folder of Mavenoid flow export JSON files to visualize
                their relationships
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Graph area */}
            <div className="flex-1 flex flex-col">
              {/* Graph Controls */}
              <GraphControls
                settings={graphSettings}
                onSettingsChange={setGraphSettings}
                hasSelectedNode={!!selectedNodeId}
              />

              {/* Stats bar */}
              {stats && viewMode === "flows" && (
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-6 text-sm">
                  <span className="text-gray-500">
                    Showing:{" "}
                    <span className="font-medium text-gray-900">
                      {visibleStats?.nodes || 0}
                    </span>{" "}
                    of {stats.total} flows
                  </span>
                  <span className="text-gray-500">
                    Root:{" "}
                    <span className="font-medium text-green-600">
                      {stats.roots}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Components:{" "}
                    <span className="font-medium text-indigo-600">
                      {stats.components}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Edges:{" "}
                    <span className="font-medium text-gray-900">
                      {visibleStats?.edges || 0}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setData(null);
                      setSelectedFlow(null);
                      setSelectedNodeId(null);
                      setSearchTerm("");
                      setGraphSettings(DEFAULT_GRAPH_SETTINGS);
                    }}
                    className="ml-auto text-gray-500 hover:text-gray-700"
                  >
                    Load different files
                  </button>
                </div>
              )}

              {viewMode === "operations" && selectedFlow && (
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-6 text-sm">
                  <span className="text-gray-500">
                    Operations:{" "}
                    <span className="font-medium text-gray-900">
                      {selectedFlow.operations.length}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Connections:{" "}
                    <span className="font-medium text-gray-900">
                      {selectedFlow.connections.length}
                    </span>
                  </span>
                </div>
              )}

              {/* Graph */}
              <div className="flex-1 p-4">
                {graphData && (
                  <GraphView
                    data={graphData}
                    onNodeClick={handleNodeClick}
                    viewMode={viewMode}
                    settings={graphSettings}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <Sidebar
              selectedNodeId={selectedNodeId}
              data={data}
              viewMode={viewMode}
              selectedFlow={selectedFlow}
              onDrillDown={handleDrillDown}
            />
          </>
        )}
      </main>

      {/* Legend */}
      {data && viewMode === "flows" && (
        <footer className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-gray-500">Legend:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }}></span>
              <span className="text-gray-600">Flow (Root)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: "#d4d5db" }}></span>
              <span className="text-gray-600">Component</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-400"></span>
              <span className="text-gray-600">External Reference</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-gray-400"></span>
              <span className="text-gray-600">Resolve</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-0.5 bg-pink-400 border-dashed border-t-2 border-pink-400"></span>
              <span className="text-gray-600">Link</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
