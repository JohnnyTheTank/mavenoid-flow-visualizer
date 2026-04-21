import { useState, useCallback, useMemo } from "react";
import { 
  AppShell, 
  Title, 
  TextInput, 
  Group, 
  Stack, 
  Container,
  Paper,
  Text,
  Grid,
  Box
} from '@mantine/core';
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
    <AppShell
      header={{ height: 60 }}
      navbar={
        data && selectedNodeId
          ? { width: 320, breakpoint: 'md' }
          : undefined
      }
      padding={0}
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={2}>Mavenoid Flow Visualizer</Title>
          {data && viewMode === "flows" && (
            <TextInput
              placeholder="Search flows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ width: 300 }}
            />
          )}
        </Group>
      </AppShell.Header>

      {/* Sidebar */}
      {data && selectedNodeId && (
        <AppShell.Navbar>
          <Sidebar
            selectedNodeId={selectedNodeId}
            data={data}
            viewMode={viewMode}
            selectedFlow={selectedFlow}
            onDrillDown={handleDrillDown}
          />
        </AppShell.Navbar>
      )}

      {/* Main Content */}
      <AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {!data ? (
          <Container size="sm" py="xl">
            <FileUploader
              onFilesSelected={handleFilesSelected}
              isLoading={isLoading}
            />
          </Container>
        ) : (
          <>
            {/* Stats Bar */}
            {stats && (
              <Paper p="md" radius={0} withBorder>
                <Grid>
                  <Grid.Col span="auto">
                    <Group gap="xl">
                      <StatItem label="Total Flows" value={stats.total} />
                      <StatItem label="Root Flows" value={stats.roots} color="green" />
                      <StatItem label="Components" value={stats.components} color="indigo" />
                      <StatItem label="References" value={stats.references} />
                      {visibleStats && (
                        <>
                          <Box style={{ width: 1, height: 32, backgroundColor: 'var(--mantine-color-gray-3)' }} />
                          <StatItem label="Visible Nodes" value={visibleStats.nodes} />
                          <StatItem label="Visible Edges" value={visibleStats.edges} />
                        </>
                      )}
                    </Group>
                  </Grid.Col>
                  <Grid.Col span="content">
                    <ViewToggle
                      viewMode={viewMode}
                      onViewChange={handleViewChange}
                      selectedFlowName={selectedFlow?.name}
                      onBackToFlows={handleBackToFlows}
                    />
                  </Grid.Col>
                </Grid>
              </Paper>
            )}

            {/* Graph Controls */}
            {viewMode === "flows" && (
              <GraphControls
                settings={graphSettings}
                onSettingsChange={setGraphSettings}
                hasSelectedNode={selectedNodeId !== null}
              />
            )}

            {/* Graph View */}
            <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {graphData && (
                <GraphView
                  data={graphData}
                  settings={graphSettings}
                  onNodeClick={handleNodeClick}
                  viewMode={viewMode}
                />
              )}
            </Box>
          </>
        )}
      </AppShell.Main>
    </AppShell>
  );
}

function StatItem({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color?: string;
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="xl" fw={700} c={color}>
        {value}
      </Text>
    </Stack>
  );
}

export default App;
