import { useCallback, useState } from "react";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

export function FileUploader({ onFilesSelected, isLoading }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      // Handle folder drops
      for (const item of items) {
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry?.();
          if (entry) {
            const entryFiles = await readEntry(entry);
            files.push(...entryFiles);
          } else {
            const file = item.getAsFile();
            if (file && file.name.endsWith(".json")) {
              files.push(file);
            }
          }
        }
      }

      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.name.endsWith(".json")
      );
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }
        ${isLoading ? "opacity-50 pointer-events-none" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="text-gray-600">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isLoading ? "Loading..." : "Drop Mavenoid flow JSON files here"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or drop a folder containing JSON files
          </p>
        </div>
        <div>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors inline-block">
              Select Files
            </span>
            <input
              type="file"
              className="hidden"
              accept=".json"
              multiple
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Recursively read files from a FileSystemEntry (for folder drops)
 */
async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    return new Promise((resolve) => {
      fileEntry.file((file) => {
        if (file.name.endsWith(".json")) {
          resolve([file]);
        } else {
          resolve([]);
        }
      });
    });
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const files: File[] = [];

    const readEntries = (): Promise<FileSystemEntry[]> =>
      new Promise((resolve) => {
        reader.readEntries((entries) => resolve(entries));
      });

    let entries = await readEntries();
    while (entries.length > 0) {
      for (const e of entries) {
        const entryFiles = await readEntry(e);
        files.push(...entryFiles);
      }
      entries = await readEntries();
    }

    return files;
  }

  return [];
}
