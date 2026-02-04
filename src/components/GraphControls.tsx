import { useState } from "react";
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
    <div className="bg-white border-b border-gray-200">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50"
      >
        <span className="font-medium">Display Options</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-100 grid grid-cols-4 gap-6">
          {/* Layout Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Layout
            </h3>
            <select
              value={settings.layout}
              onChange={(e) => updateSetting("layout", e.target.value as LayoutType)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Node Options */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Nodes
            </h3>
            <div className="space-y-2">
              <Toggle
                label="Show labels"
                checked={settings.showLabels}
                onChange={(v) => updateSetting("showLabels", v)}
              />
              <Toggle
                label="Size by connections"
                checked={settings.sizeByConnections}
                onChange={(v) => updateSetting("sizeByConnections", v)}
              />
              <Toggle
                label="Compact mode"
                checked={settings.compactMode}
                onChange={(v) => updateSetting("compactMode", v)}
              />
            </div>
          </div>

          {/* Edge Options */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Edges
            </h3>
            <div className="space-y-2">
              <Toggle
                label="Curved edges"
                checked={settings.curvedEdges}
                onChange={(v) => updateSetting("curvedEdges", v)}
              />
              <Toggle
                label="Show arrows"
                checked={settings.showArrows}
                onChange={(v) => updateSetting("showArrows", v)}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Thickness:</span>
                <select
                  value={settings.edgeThickness}
                  onChange={(e) =>
                    updateSetting("edgeThickness", e.target.value as "thin" | "normal" | "thick")
                  }
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="thin">Thin</option>
                  <option value="normal">Normal</option>
                  <option value="thick">Thick</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Filters
            </h3>
            <div className="space-y-2">
              <Toggle
                label="Show root flows"
                checked={settings.showRoots}
                onChange={(v) => updateSetting("showRoots", v)}
              />
              <Toggle
                label="Show components"
                checked={settings.showComponents}
                onChange={(v) => updateSetting("showComponents", v)}
              />
              <Toggle
                label="Show external refs"
                checked={settings.showExternal}
                onChange={(v) => updateSetting("showExternal", v)}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Min connections:</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={settings.minConnections}
                  onChange={(e) => updateSetting("minConnections", parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <Toggle
                label="Isolate selected"
                checked={settings.isolateSelected}
                onChange={(v) => updateSetting("isolateSelected", v)}
                disabled={!hasSelectedNode}
                title={hasSelectedNode ? undefined : "Select a node first"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
}

function Toggle({ label, checked, onChange, disabled, title }: ToggleProps) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  );
}
