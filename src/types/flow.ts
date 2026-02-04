// Raw JSON structure from Mavenoid export files

export interface MavenoidExport {
  exportFormatVersion: number;
  productSupportModelId: string;
  productSupportModelType: string;
  productId: number;
  productImageUrl: string;
  supportModels: SupportModel[];
}

export interface SupportModel {
  id: string;
  name: string;
  publicName: string | null;
  kind: "root" | "component";
  operations: Operation[];
  connections: Connection[];
  productId: number;
  orgId: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  type: string;
  excludeFromTranslations: boolean;
  overrideOperationReviewsExpireAfterDays: number | null;
  initFormData: unknown[];
}

export interface Operation {
  id: string;
  type: string;
  cx: number;
  cy: number;
  // ResolveFlowOperation
  flowId?: string;
  // FlowLinkOperation
  targetFlowId?: string;
  name?: string;
  productId?: number;
  keepCurrentAsMainFlow?: boolean;
  resolveImageFromProduct?: boolean;
  // Common fields
  prompt?: string;
  details?: string;
  text?: string;
  displaySize?: string;
  shortcutOperationIds?: ShortcutOperationId[] | string[];
  // Other optional fields
  allowUnknown?: boolean;
  isTriage?: boolean;
  isSearchable?: boolean;
  question?: string;
  answerFaulty?: string;
  answerWorking?: string;
  isAnswerFaultyFirst?: boolean;
  excludeFromCopilotSearch?: boolean;
  skipLabel?: string;
  placeholder?: string;
  shortcutsLabel?: string;
  noneOfTheAboveLabel?: string;
  filterSearchableTypes?: {
    node: boolean;
    document: boolean;
  };
  searchAvailability?: string;
}

export interface ShortcutOperationId {
  flowId: string;
  operationId: string;
}

export interface Connection {
  id: string;
  manualRank?: number;
  sourceOperationId: string;
  targetOperationId: string;
  sourceConnectorKey?: string;
  targetConnectorKey?: string;
}

// Processed data structures for visualization

export interface Flow {
  id: string;
  name: string;
  kind: "root" | "component";
  sourceFile: string;
  operations: Operation[];
  connections: Connection[];
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlowReference {
  sourceFlowId: string;
  targetFlowId: string;
  operationType: "ResolveFlowOperation" | "FlowLinkOperation";
  operationId: string;
  operationName?: string;
}

export interface ParsedData {
  flows: Map<string, Flow>;
  references: FlowReference[];
}

// Cytoscape graph data types

export interface GraphNode {
  data: {
    id: string;
    label: string;
    kind?: "root" | "component" | "unknown";
    type?: string;
    sourceFile?: string;
    flowId?: string;
  };
}

export interface GraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label?: string;
    operationType?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Graph display settings

export type LayoutType =
  | "dagre-lr"
  | "dagre-tb"
  | "dagre-rl"
  | "dagre-bt"
  | "force"
  | "circular"
  | "concentric"
  | "grid"
  | "breadthfirst";

export interface GraphSettings {
  layout: LayoutType;
  // Node options
  showLabels: boolean;
  sizeByConnections: boolean;
  compactMode: boolean;
  // Edge options
  curvedEdges: boolean;
  showArrows: boolean;
  edgeThickness: "thin" | "normal" | "thick";
  // Filters
  showRoots: boolean;
  showComponents: boolean;
  showExternal: boolean;
  minConnections: number;
  isolateSelected: boolean;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  layout: "force",
  showLabels: true,
  sizeByConnections: false,
  compactMode: true,
  curvedEdges: true,
  showArrows: true,
  edgeThickness: "thin",
  showRoots: true,
  showComponents: true,
  showExternal: true,
  minConnections: 0,
  isolateSelected: false,
};
