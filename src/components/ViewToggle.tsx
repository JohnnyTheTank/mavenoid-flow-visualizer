import { Group, SegmentedControl, Button, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

interface ViewToggleProps {
  viewMode: "flows" | "operations";
  onViewChange: (mode: "flows" | "operations") => void;
  selectedFlowName?: string;
  onBackToFlows?: () => void;
}

export function ViewToggle({
  viewMode,
  onViewChange,
  selectedFlowName,
  onBackToFlows,
}: ViewToggleProps) {
  return (
    <Group gap="md">
      {viewMode === "operations" && onBackToFlows && (
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={onBackToFlows}
          size="sm"
        >
          Back to Flows
        </Button>
      )}

      {viewMode === "operations" && selectedFlowName && (
        <Text size="sm" c="dimmed">
          Viewing: <Text component="span" fw={500}>{selectedFlowName}</Text>
        </Text>
      )}

      <SegmentedControl
        value={viewMode}
        onChange={(value) => onViewChange(value as "flows" | "operations")}
        data={[
          { label: 'Flows', value: 'flows' },
          { 
            label: 'Operations', 
            value: 'operations',
            disabled: viewMode !== "operations" && !selectedFlowName
          },
        ]}
      />
    </Group>
  );
}
