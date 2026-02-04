# Mavenoid Flow Visualizer

Visualize relationships between Mavenoid flows and drill into operation graphs. Drop a folder of Mavenoid export JSON files and explore how flows link and resolve to one another.

## Features

- Flow dependency graph with root/component/external nodes
- Drill down from a flow to its operation graph
- Search flows by name
- Filter by kind, minimum connections, and isolate selected subgraphs
- Multiple layouts (dagre, force, circular, grid, breadth-first)
- Sidebar details for flows and operations

## Getting Started

### Requirements

- Node.js 18+ (recommended)
- Yarn

### Install

```bash
yarn install
```

### Run (dev)

```bash
yarn dev
```

Open the local URL shown in the terminal.

### Build

```bash
yarn build
```

### Preview the production build

```bash
yarn preview
```

## Usage

1. Export your Mavenoid flows as JSON files.
2. Drag and drop a folder (or multiple JSON files) onto the uploader.
3. Use the top-right toggle to switch between the flow graph and operation graph.
4. Click a node to see details in the sidebar.
5. Adjust layout and filters in the “Display Options” panel.

## Data Expectations

The app expects Mavenoid export JSON with a `supportModels` array. Each support model becomes a flow node. References between flows are inferred from operations of type:

- `ResolveFlowOperation` (uses `flowId`)
- `FlowLinkOperation` (uses `targetFlowId`)

If a referenced flow is missing from the imported files, it is rendered as an external node.

## Tech Stack

- React + TypeScript + Vite
- Cytoscape + cytoscape-dagre for graph rendering
- Tailwind CSS

## Notes

All parsing and visualization happens in the browser. Your JSON files are not uploaded anywhere.
