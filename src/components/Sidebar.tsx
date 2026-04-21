import { Stack, Title, Badge, Button, Text, Divider, Group } from '@mantine/core';
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
      <Stack p="md">
        <Text size="sm" c="dimmed">
          Click on a node to see details
        </Text>
      </Stack>
    );
  }

  if (viewMode === "flows") {
    const flow = data.flows.get(selectedNodeId);
    if (!flow) {
      return (
        <Stack p="md">
          <Text size="sm" c="dimmed">Flow not found</Text>
        </Stack>
      );
    }

    const incomingRefs = data.references.filter(
      (r) => r.targetFlowId === selectedNodeId
    );
    const outgoingRefs = data.references.filter(
      (r) => r.sourceFlowId === selectedNodeId
    );

    return (
      <Stack p="md" gap="md" style={{ overflow: 'auto' }}>
        <FlowDetails
          flow={flow}
          incomingRefs={incomingRefs}
          outgoingRefs={outgoingRefs}
          data={data}
          onDrillDown={onDrillDown}
        />
      </Stack>
    );
  }

  // Operations view
  if (!selectedFlow) {
    return (
      <Stack p="md">
        <Text size="sm" c="dimmed">No flow selected</Text>
      </Stack>
    );
  }

  const operation = selectedFlow.operations.find((op) => op.id === selectedNodeId);
  if (!operation) {
    return (
      <Stack p="md">
        <Text size="sm" c="dimmed">Operation not found</Text>
      </Stack>
    );
  }

  return (
    <Stack p="md" gap="md" style={{ overflow: 'auto' }}>
      <OperationDetails
        operation={operation}
        flow={selectedFlow}
        data={data}
        onDrillDown={onDrillDown}
      />
    </Stack>
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
    <Stack gap="md">
      <div>
        <Title order={3}>{flow.name}</Title>
        <Badge 
          color={flow.kind === "root" ? "green" : "indigo"} 
          mt="xs"
        >
          {flow.kind}
        </Badge>
      </div>

      <Stack gap="xs">
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
      </Stack>

      <Button
        fullWidth
        onClick={() => onDrillDown(flow.id)}
      >
        View Operations
      </Button>

      {incomingRefs.length > 0 && (
        <>
          <Divider />
          <div>
            <Text fw={500} size="sm" mb="xs">
              Referenced by ({incomingRefs.length})
            </Text>
            <Stack gap="xs">
              {incomingRefs.slice(0, 10).map((ref, i) => {
                const sourceFlow = data.flows.get(ref.sourceFlowId);
                return (
                  <Text 
                    key={i} 
                    size="sm" 
                    c="dimmed" 
                    truncate="end"
                    title={sourceFlow?.name || ref.sourceFlowId}
                  >
                    {sourceFlow?.name || ref.sourceFlowId.slice(-8)}
                  </Text>
                );
              })}
              {incomingRefs.length > 10 && (
                <Text size="sm" c="dimmed">
                  +{incomingRefs.length - 10} more
                </Text>
              )}
            </Stack>
          </div>
        </>
      )}

      {outgoingRefs.length > 0 && (
        <>
          <Divider />
          <div>
            <Text fw={500} size="sm" mb="xs">
              References ({outgoingRefs.length})
            </Text>
            <Stack gap="xs">
              {outgoingRefs.slice(0, 10).map((ref, i) => {
                const targetFlow = data.flows.get(ref.targetFlowId);
                return (
                  <Text 
                    key={i} 
                    size="sm" 
                    c="dimmed" 
                    truncate="end"
                    title={targetFlow?.name || ref.targetFlowId}
                  >
                    {targetFlow?.name || ref.targetFlowId.slice(-8)}
                  </Text>
                );
              })}
              {outgoingRefs.length > 10 && (
                <Text size="sm" c="dimmed">
                  +{outgoingRefs.length - 10} more
                </Text>
              )}
            </Stack>
          </div>
        </>
      )}
    </Stack>
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
    <Stack gap="md">
      <div>
        <Title order={3}>
          {operation.name || operation.prompt || operation.type}
        </Title>
        <Badge color="gray" mt="xs">
          {operation.type.replace(/Operation$/, "")}
        </Badge>
      </div>

      <Stack gap="xs">
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
      </Stack>

      {linkedFlow && (
        <Stack 
          gap="sm" 
          p="md" 
          style={{ 
            backgroundColor: 'var(--mantine-color-indigo-0)', 
            borderRadius: 'var(--mantine-radius-md)' 
          }}
        >
          <Text size="sm" c="indigo.7">
            Links to: <Text component="span" fw={500}>{linkedFlow.name}</Text>
          </Text>
          <Button
            size="xs"
            onClick={() => onDrillDown(linkedFlow.id)}
          >
            Go to Flow
          </Button>
        </Stack>
      )}

      <Stack gap="xs">
        <Text size="sm" c="dimmed">Incoming: {incomingConnections.length}</Text>
        <Text size="sm" c="dimmed">Outgoing: {outgoingConnections.length}</Text>
      </Stack>
    </Stack>
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
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed">{label}:</Text>
      <Text 
        size="sm" 
        ff={mono ? 'monospace' : undefined}
        truncate="end"
        style={{ maxWidth: '65%' }}
        title={value}
      >
        {value}
      </Text>
    </Group>
  );
}
