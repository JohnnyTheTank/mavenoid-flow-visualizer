import { useState } from "react";
import { 
  Select, 
  Switch, 
  NumberInput, 
  Accordion, 
  Stack, 
  Text, 
  Grid,
  Paper
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import type { GraphSettings, LayoutType } from "../types/flow";

interface GraphControlsProps {
  settings: GraphSettings;
  onSettingsChange: (settings: GraphSettings) => void;
  hasSelectedNode: boolean;
}

const LAYOUT_OPTIONS: { value: LayoutType; label: string; group: string }[] = [
  { value: "dagre-lr", label: "Hierarchical (Left to Right)", group: "Hierarchical" },
  { value: "dagre-tb", label: "Hierarchical (Top to Bottom)", group: "Hierarchical" },
  { value: "dagre-rl", label: "Hierarchical (Right to Left)", group: "Hierarchical" },
  { value: "dagre-bt", label: "Hierarchical (Bottom to Top)", group: "Hierarchical" },
  { value: "force", label: "Force-Directed", group: "Physics" },
  { value: "circular", label: "Circular", group: "Geometric" },
  { value: "concentric", label: "Concentric (by connections)", group: "Geometric" },
  { value: "grid", label: "Grid", group: "Geometric" },
  { value: "breadthfirst", label: "Breadth-First (from roots)", group: "Tree" },
];

export function GraphControls({
  settings,
  onSettingsChange,
  hasSelectedNode,
}: GraphControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateSetting = <K extends keyof GraphSettings>(
    key: K,
    value: GraphSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Paper withBorder>
      <Accordion 
        value={isExpanded ? 'display-options' : null}
        onChange={(value) => setIsExpanded(value === 'display-options')}
        chevron={<IconChevronDown size={16} />}
      >
        <Accordion.Item value="display-options">
          <Accordion.Control>
            <Text size="sm" fw={500}>Display Options</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Grid>
              {/* Layout Section */}
              <Grid.Col span={3}>
                <Stack gap="xs">
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    Layout
                  </Text>
                  <Select
                    data={LAYOUT_OPTIONS.map(opt => ({ 
                      value: opt.value, 
                      label: opt.label 
                    }))}
                    value={settings.layout}
                    onChange={(value) => updateSetting('layout', value as LayoutType)}
                    size="sm"
                  />
                </Stack>
              </Grid.Col>

              {/* Node Options */}
              <Grid.Col span={3}>
                <Stack gap="xs">
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    Nodes
                  </Text>
                  <Switch
                    label="Show labels"
                    checked={settings.showLabels}
                    onChange={(e) => updateSetting('showLabels', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Switch
                    label="Size by connections"
                    checked={settings.sizeByConnections}
                    onChange={(e) => updateSetting('sizeByConnections', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Switch
                    label="Compact mode"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.currentTarget.checked)}
                    size="sm"
                  />
                </Stack>
              </Grid.Col>

              {/* Edge Options */}
              <Grid.Col span={3}>
                <Stack gap="xs">
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    Edges
                  </Text>
                  <Switch
                    label="Curved edges"
                    checked={settings.curvedEdges}
                    onChange={(e) => updateSetting('curvedEdges', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Switch
                    label="Show arrows"
                    checked={settings.showArrows}
                    onChange={(e) => updateSetting('showArrows', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Select
                    label="Thickness"
                    data={[
                      { value: 'thin', label: 'Thin' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'thick', label: 'Thick' },
                    ]}
                    value={settings.edgeThickness}
                    onChange={(value) => updateSetting('edgeThickness', value as 'thin' | 'normal' | 'thick')}
                    size="xs"
                  />
                </Stack>
              </Grid.Col>

              {/* Filters */}
              <Grid.Col span={3}>
                <Stack gap="xs">
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    Filters
                  </Text>
                  <Switch
                    label="Show root flows"
                    checked={settings.showRoots}
                    onChange={(e) => updateSetting('showRoots', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Switch
                    label="Show components"
                    checked={settings.showComponents}
                    onChange={(e) => updateSetting('showComponents', e.currentTarget.checked)}
                    size="sm"
                  />
                  <Switch
                    label="Show external refs"
                    checked={settings.showExternal}
                    onChange={(e) => updateSetting('showExternal', e.currentTarget.checked)}
                    size="sm"
                  />
                  <NumberInput
                    label="Min connections"
                    min={0}
                    max={50}
                    value={settings.minConnections}
                    onChange={(value) => updateSetting('minConnections', Number(value) || 0)}
                    size="xs"
                  />
                  <Switch
                    label="Isolate selected"
                    checked={settings.isolateSelected}
                    onChange={(e) => updateSetting('isolateSelected', e.currentTarget.checked)}
                    disabled={!hasSelectedNode}
                    size="sm"
                  />
                </Stack>
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}
