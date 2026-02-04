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
    <div className="flex items-center gap-4">
      {viewMode === "operations" && onBackToFlows && (
        <button
          onClick={onBackToFlows}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Flows
        </button>
      )}

      {viewMode === "operations" && selectedFlowName && (
        <span className="text-sm text-gray-500">
          Viewing: <span className="font-medium text-gray-700">{selectedFlowName}</span>
        </span>
      )}

      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onViewChange("flows")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === "flows"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Flows
        </button>
        <button
          onClick={() => onViewChange("operations")}
          disabled={viewMode !== "operations" && !selectedFlowName}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === "operations"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          Operations
        </button>
      </div>
    </div>
  );
}
