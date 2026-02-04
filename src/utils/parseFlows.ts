import type {
  MavenoidExport,
  Flow,
  FlowReference,
  ParsedData,
  Operation,
} from "../types/flow";

/**
 * Parse multiple Mavenoid export JSON files and extract flows and their relationships
 */
export function parseFlowFiles(
  files: { name: string; content: MavenoidExport }[]
): ParsedData {
  const flows = new Map<string, Flow>();
  const references: FlowReference[] = [];

  for (const file of files) {
    const { supportModels } = file.content;

    if (!supportModels || !Array.isArray(supportModels)) {
      console.warn(`No supportModels found in ${file.name}`);
      continue;
    }

    for (const model of supportModels) {
      // Extract flow
      const flow: Flow = {
        id: model.id,
        name: model.name,
        kind: model.kind,
        sourceFile: file.name,
        operations: model.operations || [],
        connections: model.connections || [],
        productId: model.productId,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      };

      flows.set(model.id, flow);

      // Extract flow references from operations
      for (const operation of model.operations || []) {
        const ref = extractFlowReference(model.id, operation);
        if (ref) {
          references.push(ref);
        }
      }
    }
  }

  return { flows, references };
}

/**
 * Extract flow reference from an operation if it references another flow
 */
function extractFlowReference(
  sourceFlowId: string,
  operation: Operation
): FlowReference | null {
  if (operation.type === "ResolveFlowOperation" && operation.flowId) {
    return {
      sourceFlowId,
      targetFlowId: operation.flowId,
      operationType: "ResolveFlowOperation",
      operationId: operation.id,
      operationName: operation.name,
    };
  }

  if (operation.type === "FlowLinkOperation" && operation.targetFlowId) {
    return {
      sourceFlowId,
      targetFlowId: operation.targetFlowId,
      operationType: "FlowLinkOperation",
      operationId: operation.id,
      operationName: operation.name,
    };
  }

  return null;
}

/**
 * Read and parse a JSON file
 */
export async function readJsonFile(
  file: File
): Promise<{ name: string; content: MavenoidExport } | null> {
  try {
    const text = await file.text();
    const content = JSON.parse(text) as MavenoidExport;
    return { name: file.name, content };
  } catch (error) {
    console.error(`Failed to parse ${file.name}:`, error);
    return null;
  }
}

/**
 * Process multiple files and return parsed data
 */
export async function processFiles(files: File[]): Promise<ParsedData> {
  const parsedFiles = await Promise.all(files.map(readJsonFile));
  const validFiles = parsedFiles.filter(
    (f): f is { name: string; content: MavenoidExport } => f !== null
  );
  return parseFlowFiles(validFiles);
}
