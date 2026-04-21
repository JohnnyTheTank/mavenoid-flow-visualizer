import { useCallback, useState } from "react";
import { Stack, Text, Button, Paper } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';

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
    <Paper
      withBorder
      radius="md"
      p="xl"
      style={{
        border: isDragOver 
          ? '2px dashed var(--mantine-color-blue-5)' 
          : '2px dashed var(--mantine-color-gray-3)',
        backgroundColor: isDragOver 
          ? 'var(--mantine-color-blue-0)' 
          : 'transparent',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : 'auto',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stack align="center" gap="md">
        <IconUpload size={48} stroke={1.5} color="var(--mantine-color-gray-5)" />
        
        <Text size="lg" fw={500}>
          {isLoading ? "Loading..." : "Drop Mavenoid flow JSON files here"}
        </Text>
        
        <Text size="sm" c="dimmed">
          or drop a folder containing JSON files
        </Text>
        
        <Button
          component="label"
          loading={isLoading}
          leftSection={<IconUpload size={16} />}
        >
          Select Files
          <input
            type="file"
            hidden
            accept=".json"
            multiple
            onChange={handleFileInput}
            disabled={isLoading}
          />
        </Button>
      </Stack>
    </Paper>
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
