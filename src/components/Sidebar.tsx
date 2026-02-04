import type { Flow, Operation, ParsedData } from "../types/flow";

interface SidebarProps {
  selectedNodeId: string | null;
  data: ParsedData;
  viewMode: "flows" | "operations";
  selectedFlow: Flow | null;
  onDrillDown: (flowId: string) => void;
}

export function Sidebar({
  selectedNodeId,
  data,
  viewMode,
  selectedFlow,
  onDrillDown,
}: SidebarProps) {
  if (!selectedNodeId) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">
          Click on a node to see details
        </p>
      </div>
    );
  }

  if (viewMode === "flows") {
    const flow = data.flows.get(selectedNodeId);
    if (!flow) {
      return (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Flow not found</p>
        </div>
      );
    }

    const incomingRefs = data.references.filter(
      (r) => r.targetFlowId === selectedNodeId
    );
    const outgoingRefs = data.references.filter(
      (r) => r.sourceFlowId === selectedNodeId
    );

    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <FlowDetails
          flow={flow}
          incomingRefs={incomingRefs}
          outgoingRefs={outgoingRefs}
          data={data}
          onDrillDown={onDrillDown}
        />
      </div>
    );
  }

  // Operations view
  if (!selectedFlow) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">No flow selected</p>
      </div>
    );
  }

  const operation = selectedFlow.operations.find((op) => op.id === selectedNodeId);
  if (!operation) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-sm">Operation not found</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <OperationDetails
        operation={operation}
        flow={selectedFlow}
        data={data}
        onDrillDown={onDrillDown}
      />
    </div>
  );
}

interface FlowDetailsProps {
  flow: Flow;
  incomingRefs: { sourceFlowId: string; operationType: string }[];
  outgoingRefs: { targetFlowId: string; operationType: string }[];
  data: ParsedData;
  onDrillDown: (flowId: string) => void;
}

function FlowDetails({
  flow,
  incomingRefs,
  outgoingRefs,
  data,
  onDrillDown,
}: FlowDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg text-gray-900">{flow.name}</h2>
        <span
          className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
            flow.kind === "root"
              ? "bg-green-100 text-green-800"
              : "bg-indigo-100 text-indigo-800"
          }`}
        >
          {flow.kind}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <DetailRow label="ID" value={flow.id} mono />
        <DetailRow label="Source File" value={flow.sourceFile} />
        <DetailRow label="Operations" value={String(flow.operations.length)} />
        <DetailRow label="Connections" value={String(flow.connections.length)} />
        {flow.createdAt && (
          <DetailRow
            label="Created"
            value={new Date(flow.createdAt).toLocaleDateString()}
          />
        )}
        {flow.updatedAt && (
          <DetailRow
            label="Updated"
            value={new Date(flow.updatedAt).toLocaleDateString()}
          />
        )}
      </div>

      <button
        onClick={() => onDrillDown(flow.id)}
        className="w-full px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-md hover:bg-indigo-600 transition-colors"
      >
        View Operations
      </button>

      {incomingRefs.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-2">
            Referenced by ({incomingRefs.length})
          </h3>
          <ul className="space-y-1">
            {incomingRefs.slice(0, 10).map((ref, i) => {
              const sourceFlow = data.flows.get(ref.sourceFlowId);
              return (
                <li
                  key={i}
                  className="text-sm text-gray-600 truncate"
                  title={sourceFlow?.name || ref.sourceFlowId}
                >
                  {sourceFlow?.name || ref.sourceFlowId.slice(-8)}
                </li>
              );
            })}
            {incomingRefs.length > 10 && (
              <li className="text-sm text-gray-400">
                +{incomingRefs.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}

      {outgoingRefs.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-2">
            References ({outgoingRefs.length})
          </h3>
          <ul className="space-y-1">
            {outgoingRefs.slice(0, 10).map((ref, i) => {
              const targetFlow = data.flows.get(ref.targetFlowId);
              return (
                <li
                  key={i}
                  className="text-sm text-gray-600 truncate"
                  title={targetFlow?.name || ref.targetFlowId}
                >
                  {targetFlow?.name || ref.targetFlowId.slice(-8)}
                </li>
              );
            })}
            {outgoingRefs.length > 10 && (
              <li className="text-sm text-gray-400">
                +{outgoingRefs.length - 10} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface OperationDetailsProps {
  operation: Operation;
  flow: Flow;
  data: ParsedData;
  onDrillDown: (flowId: string) => void;
}

function OperationDetails({
  operation,
  flow,
  data,
  onDrillDown,
}: OperationDetailsProps) {
  const incomingConnections = flow.connections.filter(
    (c) => c.targetOperationId === operation.id
  );
  const outgoingConnections = flow.connections.filter(
    (c) => c.sourceOperationId === operation.id
  );

  const linkedFlowId = operation.flowId || operation.targetFlowId;
  const linkedFlow = linkedFlowId ? data.flows.get(linkedFlowId) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg text-gray-900">
          {operation.name || operation.prompt || operation.type}
        </h2>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
          {operation.type.replace(/Operation$/, "")}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <DetailRow label="ID" value={operation.id} mono />
        <DetailRow label="Type" value={operation.type} />
        <DetailRow label="Position" value={`(${operation.cx}, ${operation.cy})`} />
        {operation.prompt && (
          <DetailRow label="Prompt" value={operation.prompt} />
        )}
        {operation.details && (
          <DetailRow label="Details" value={operation.details} />
        )}
        {operation.text && <DetailRow label="Text" value={operation.text} />}
      </div>

      {linkedFlow && (
        <div className="p-3 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-700 mb-2">
            Links to: <span className="font-medium">{linkedFlow.name}</span>
          </p>
          <button
            onClick={() => onDrillDown(linkedFlow.id)}
            className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded hover:bg-indigo-600 transition-colors"
          >
            Go to Flow
          </button>
        </div>
      )}

      <div className="space-y-2 text-sm text-gray-600">
        <p>Incoming: {incomingConnections.length}</p>
        <p>Outgoing: {outgoingConnections.length}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span
        className={`text-gray-900 truncate ${mono ? "font-mono text-xs" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
