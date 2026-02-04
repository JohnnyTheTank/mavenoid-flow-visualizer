import { useEffect, useRef, useCallback, useMemo } from "react";
import cytoscape from "cytoscape";
import type { Core, NodeSingular, StylesheetStyle, LayoutOptions } from "cytoscape";
// @ts-expect-error cytoscape-dagre has no type declarations
import dagre from "cytoscape-dagre";
import type { GraphData, GraphSettings, LayoutType } from "../types/flow";

// Register dagre layout
cytoscape.use(dagre);

interface GraphViewProps {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
  viewMode: "flows" | "operations";
  settings: GraphSettings;
}

/**
 * Map layout type to Cytoscape layout configuration
 */
function getLayoutConfig(layoutType: LayoutType): LayoutOptions {
  switch (layoutType) {
    case "dagre-lr":
      return { name: "dagre", rankDir: "LR", nodeSep: 50, rankSep: 100, padding: 30 } as LayoutOptions;
    case "dagre-tb":
      return { name: "dagre", rankDir: "TB", nodeSep: 50, rankSep: 80, padding: 30 } as LayoutOptions;
    case "dagre-rl":
      return { name: "dagre", rankDir: "RL", nodeSep: 50, rankSep: 100, padding: 30 } as LayoutOptions;
    case "dagre-bt":
      return { name: "dagre", rankDir: "BT", nodeSep: 50, rankSep: 80, padding: 30 } as LayoutOptions;
    case "force":
      return {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        padding: 30,
      } as LayoutOptions;
    case "circular":
      return { name: "circle", padding: 30 } as LayoutOptions;
    case "concentric":
      return {
        name: "concentric",
        padding: 30,
        concentric: (node: NodeSingular) => node.degree(),
        levelWidth: () => 2,
      } as LayoutOptions;
    case "grid":
      return { name: "grid", padding: 30, rows: undefined } as LayoutOptions;
    case "breadthfirst":
      return {
        name: "breadthfirst",
        directed: true,
        padding: 30,
        spacingFactor: 1.5,
        roots: undefined, // Will auto-detect
      } as LayoutOptions;
    default:
      return { name: "dagre", rankDir: "LR", nodeSep: 50, rankSep: 100, padding: 30 } as LayoutOptions;
  }
}

/**
 * Build styles based on settings and view mode
 */
function buildStyles(
  viewMode: "flows" | "operations",
  settings: GraphSettings
): StylesheetStyle[] {
  const baseNodePadding = settings.compactMode ? "6px" : "12px";
  const baseFontSize = settings.compactMode ? "10px" : "12px";
  const baseMaxWidth = settings.compactMode ? "100px" : "150px";
  const edgeWidth = settings.edgeThickness === "thin" ? 1 : settings.edgeThickness === "thick" ? 3 : 2;
  const curveStyle = settings.curvedEdges ? "bezier" : "straight";
  const arrowShape = settings.showArrows ? "triangle" : "none";

  // Colors from user specification
  const COLORS = {
    flow: "#3b82f6",        // blue
    component: "#d4d5db",   // light gray
    question: "#48a9a6",    // teal
    message: "#737482",     // gray
    choiceList: "#48a9a6",  // teal
    symptom: "#6c598a",     // purple
    solution: "#e05a3c",    // red/orange
  };

  if (viewMode === "flows") {
    return [
      {
        selector: "node",
        style: {
          label: settings.showLabels ? "data(label)" : "",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": COLORS.component,
          color: "#374151",
          "text-outline-color": COLORS.component,
          "text-outline-width": 2,
          "font-size": baseFontSize,
          width: settings.sizeByConnections ? "mapData(degree, 0, 20, 40, 120)" : "label",
          height: settings.sizeByConnections ? "mapData(degree, 0, 20, 40, 120)" : "label",
          padding: settings.sizeByConnections ? "0px" : baseNodePadding,
          shape: "round-rectangle",
          "text-wrap": "wrap",
          "text-max-width": baseMaxWidth,
        },
      },
      {
        selector: 'node[kind = "root"]',
        style: {
          "background-color": COLORS.flow,
          "text-outline-color": COLORS.flow,
          color: "#fff",
          "border-width": 3,
          "border-color": "#2563eb",
        },
      },
      {
        selector: 'node[kind = "component"]',
        style: {
          "background-color": COLORS.component,
          "text-outline-color": COLORS.component,
          color: "#374151",
        },
      },
      {
        selector: 'node[kind = "unknown"]',
        style: {
          "background-color": "#9ca3af",
          "text-outline-color": "#9ca3af",
          color: "#fff",
          "border-style": "dashed",
          "border-width": 2,
          "border-color": "#6b7280",
        },
      },
      {
        selector: "node:selected",
        style: {
          "background-color": "#f59e0b",
          "text-outline-color": "#f59e0b",
          color: "#fff",
          "border-width": 3,
          "border-color": "#d97706",
        },
      },
      {
        selector: "edge",
        style: {
          width: edgeWidth,
          "line-color": "#94a3b8",
          "target-arrow-color": "#94a3b8",
          "target-arrow-shape": arrowShape,
          "curve-style": curveStyle,
          "arrow-scale": 1.2,
        },
      },
      {
        selector: 'edge[operationType = "FlowLinkOperation"]',
        style: {
          "line-style": "dashed",
          "line-color": "#f472b6",
          "target-arrow-color": "#f472b6",
        },
      },
    ];
  }

  // Operations view
  const opFontSize = settings.compactMode ? "9px" : "11px";
  const opPadding = settings.compactMode ? "4px" : "8px";
  const opMaxWidth = settings.compactMode ? "80px" : "120px";
  const opEdgeWidth = settings.edgeThickness === "thin" ? 1 : settings.edgeThickness === "thick" ? 2.5 : 1.5;

  return [
    {
      selector: "node",
      style: {
        label: settings.showLabels ? "data(label)" : "",
        "text-valign": "center",
        "text-halign": "center",
        "background-color": COLORS.message,
        color: "#fff",
        "text-outline-color": COLORS.message,
        "text-outline-width": 2,
        "font-size": opFontSize,
        width: settings.sizeByConnections ? "mapData(degree, 0, 10, 30, 80)" : "label",
        height: settings.sizeByConnections ? "mapData(degree, 0, 10, 30, 80)" : "label",
        padding: settings.sizeByConnections ? "0px" : opPadding,
        shape: "round-rectangle",
        "text-wrap": "wrap",
        "text-max-width": opMaxWidth,
      },
    },
    {
      selector: 'node[type = "StartOperation"]',
      style: {
        "background-color": COLORS.component,
        "text-outline-color": COLORS.component,
        color: "#374151",
        shape: "ellipse",
      },
    },
    {
      selector: 'node[type *= "Exit"]',
      style: {
        "background-color": COLORS.component,
        "text-outline-color": COLORS.component,
        color: "#374151",
        shape: "ellipse",
      },
    },
    {
      selector: 'node[type *= "Handler"]',
      style: {
        "background-color": COLORS.component,
        "text-outline-color": COLORS.component,
        color: "#374151",
        shape: "ellipse",
      },
    },
    {
      selector: 'node[type = "ResolveFlowOperation"], node[type = "FlowLinkOperation"]',
      style: {
        "background-color": COLORS.flow,
        "text-outline-color": COLORS.flow,
        shape: "round-rectangle",
        "border-width": 2,
        "border-color": "#2563eb",
      },
    },
    {
      selector: 'node[type *= "Choice"], node[type *= "Search"]',
      style: {
        "background-color": COLORS.choiceList,
        "text-outline-color": COLORS.choiceList,
        shape: "round-rectangle",
      },
    },
    {
      selector: 'node[type = "NoteOperation"]',
      style: {
        "background-color": COLORS.message,
        "text-outline-color": COLORS.message,
        shape: "round-rectangle",
      },
    },
    {
      selector: 'node[type *= "Symptom"], node[type *= "Check"]',
      style: {
        "background-color": COLORS.symptom,
        "text-outline-color": COLORS.symptom,
        shape: "round-rectangle",
      },
    },
    {
      selector: 'node[type *= "Solution"]',
      style: {
        "background-color": COLORS.solution,
        "text-outline-color": COLORS.solution,
        shape: "round-rectangle",
      },
    },
    {
      selector: "node:selected",
      style: {
        "background-color": "#f59e0b",
        "text-outline-color": "#f59e0b",
        "border-width": 3,
        "border-color": "#d97706",
      },
    },
    {
      selector: "edge",
      style: {
        width: opEdgeWidth,
        "line-color": "#cbd5e1",
        "target-arrow-color": "#cbd5e1",
        "target-arrow-shape": arrowShape,
        "curve-style": curveStyle,
        "arrow-scale": 1,
      },
    },
  ];
}

/**
 * Add degree data to nodes for size-by-connections feature
 */
function addDegreeData(data: GraphData): GraphData {
  const degrees = new Map<string, number>();

  // Count connections for each node
  for (const edge of data.edges) {
    degrees.set(edge.data.source, (degrees.get(edge.data.source) || 0) + 1);
    degrees.set(edge.data.target, (degrees.get(edge.data.target) || 0) + 1);
  }

  // Add degree to node data
  const nodes = data.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      degree: degrees.get(node.data.id) || 0,
    },
  }));

  return { nodes, edges: data.edges };
}

export function GraphView({ data, onNodeClick, viewMode, settings }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const handleNodeClick = useCallback(
    (node: NodeSingular) => {
      onNodeClick(node.id());
    },
    [onNodeClick]
  );

  // Add degree data to nodes
  const enrichedData = useMemo(() => addDegreeData(data), [data]);

  // Build styles based on settings
  const styles = useMemo(
    () => buildStyles(viewMode, settings),
    [viewMode, settings]
  );

  // Get layout configuration
  const layoutConfig = useMemo(
    () => getLayoutConfig(settings.layout),
    [settings.layout]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...enrichedData.nodes, ...enrichedData.edges],
      style: styles,
      layout: layoutConfig,
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Handle node clicks
    cy.on("tap", "node", (evt) => {
      handleNodeClick(evt.target);
    });

    // Fit to viewport
    cy.fit(undefined, 50);

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [enrichedData, handleNodeClick, styles, layoutConfig]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 rounded-lg" />
  );
}
