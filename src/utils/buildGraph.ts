import type {
  ParsedData,
  Flow,
  GraphData,
  GraphNode,
  GraphEdge,
} from "../types/flow";

/**
 * Build a high-level graph showing flow-to-flow relationships
 */
export function buildFlowGraph(data: ParsedData): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  // Create nodes for each flow
  for (const [id, flow] of data.flows) {
    nodes.push({
      data: {
        id,
        label: flow.name,
        kind: flow.kind,
        sourceFile: flow.sourceFile,
      },
    });
  }

  // Create edges for each reference
  for (const ref of data.references) {
    const edgeKey = `${ref.sourceFlowId}->${ref.targetFlowId}`;

    // Skip duplicate edges
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);

    // Check if target flow exists, if not create a placeholder node
    if (!data.flows.has(ref.targetFlowId)) {
      nodes.push({
        data: {
          id: ref.targetFlowId,
          label: `External: ${ref.targetFlowId}`,
          kind: "unknown",
        },
      });
      data.flows.set(ref.targetFlowId, {
        id: ref.targetFlowId,
        name: `External: ${ref.targetFlowId}`,
        kind: "component",
        sourceFile: "unknown",
        operations: [],
        connections: [],
        productId: 0,
        createdAt: "",
        updatedAt: "",
      });
    }

    edges.push({
      data: {
        id: `edge-${ref.operationId}`,
        source: ref.sourceFlowId,
        target: ref.targetFlowId,
        operationType: ref.operationType,
        label: ref.operationType === "FlowLinkOperation" ? "link" : "resolve",
      },
    });
  }

  return { nodes, edges };
}

/**
 * Build a detailed graph showing operations within a single flow
 */
export function buildOperationsGraph(flow: Flow): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create nodes for each operation
  for (const op of flow.operations) {
    const label = getOperationLabel(op);
    nodes.push({
      data: {
        id: op.id,
        label,
        type: op.type,
        flowId: op.flowId || op.targetFlowId,
      },
    });
  }

  // Create edges for each connection
  for (const conn of flow.connections) {
    edges.push({
      data: {
        id: conn.id,
        source: conn.sourceOperationId,
        target: conn.targetOperationId,
      },
    });
  }

  return { nodes, edges };
}

/**
 * Get a human-readable label for an operation
 */
function getOperationLabel(op: {
  type: string;
  name?: string;
  prompt?: string;
  text?: string;
  flowId?: string;
  targetFlowId?: string;
}): string {
  // Use name if available
  if (op.name) return op.name;

  // Use prompt for choice/search operations
  if (op.prompt) return truncate(op.prompt, 30);

  // Use text for notes
  if (op.text) return truncate(op.text, 30);

  // Special labels for common operation types
  switch (op.type) {
    case "StartOperation":
      return "Start";
    case "SuccessHandlerExitOperation":
      return "Success Exit";
    case "NoAcceptedSolutionsHandlerExitOperation":
      return "No Solution Exit";
    case "SuccessHandlerEnterOperation":
      return "Success Handler";
    case "NoAcceptedSolutionsHandlerEnterOperation":
      return "No Solution Handler";
    case "ResolveFlowOperation":
      return `Resolve: ${op.flowId?.slice(-6) || "?"}`;
    case "FlowLinkOperation":
      return `Link: ${op.targetFlowId?.slice(-6) || "?"}`;
    default:
      return op.type.replace(/Operation$/, "");
  }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Get operation type category for coloring
 */
export function getOperationCategory(type: string): string {
  if (type.includes("Start")) return "start";
  if (type.includes("Exit") || type.includes("Handler")) return "handler";
  if (type.includes("ResolveFlow") || type.includes("FlowLink")) return "flow";
  if (type.includes("Choice") || type.includes("Search")) return "interaction";
  if (type.includes("Note")) return "note";
  if (type.includes("Symptom") || type.includes("Check")) return "check";
  return "default";
}
