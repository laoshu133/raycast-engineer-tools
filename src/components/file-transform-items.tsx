import { Action, ActionPanel, Clipboard, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  encodeFile,
  FILE_HASH_ALGORITHMS,
  fileError,
  hashFile,
  MAX_BASE64_FILE_BYTES,
  type FileHashAlgorithm,
  type InputFile,
} from "../utils/file-input";

export function FileTransformItems({
  file,
  operation,
  inputActions,
}: {
  file: InputFile;
  operation: "encode" | "hash";
  inputActions: ReactNode;
}) {
  const active = useRef<AbortController | undefined>(undefined);
  const mounted = useRef(true);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);

  const run = async (format: "base64" | "dataURL" | FileHashAlgorithm) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setRunning(true);
    const label = format === "dataURL" ? "Data URL" : format.toUpperCase();
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Reading file for ${label}…`,
      message: file.name,
      primaryAction: { title: "Cancel", onAction: () => controller.abort() },
    });
    try {
      const result =
        format === "base64" || format === "dataURL"
          ? await encodeFile(file.path, format === "dataURL", controller.signal)
          : await hashFile(file.path, format, controller.signal);
      controller.signal.throwIfAborted();
      await Clipboard.copy(result);
      toast.style = Toast.Style.Success;
      toast.title = `Copied file ${label}`;
      toast.primaryAction = undefined;
    } catch (error) {
      toast.style = controller.signal.aborted ? Toast.Style.Success : Toast.Style.Failure;
      toast.title = controller.signal.aborted ? "Cancelled" : "Could not process file";
      toast.message = fileError(error);
      toast.primaryAction = undefined;
    } finally {
      if (mounted.current) setRunning(false);
      active.current = undefined;
    }
  };

  const tooLarge = operation === "encode" && file.size > MAX_BASE64_FILE_BYTES;
  return (
    <List.Section title="File Content" subtitle={`${file.name} · ${file.size.toLocaleString()} bytes`}>
      {operation === "encode" ? (
        <List.Item
          id="file-base64"
          title="Encode File Content as Base64"
          subtitle={tooLarge ? "File exceeds the 32 MiB limit" : "↵ Base64 · ⇧↵ Data URL"}
          icon={tooLarge ? Icon.Warning : Icon.Document}
          accessories={running ? [{ text: "Processing…" }] : []}
          actions={
            tooLarge ? (
              <ActionPanel>{inputActions}</ActionPanel>
            ) : (
              <ActionPanel>
                <Action title="Copy File Base64" icon={Icon.CopyClipboard} onAction={() => run("base64")} />
                <Action
                  title="Copy File Data URL"
                  icon={Icon.CopyClipboard}
                  shortcut={{ modifiers: ["shift"], key: "return" }}
                  onAction={() => run("dataURL")}
                />
                {inputActions}
              </ActionPanel>
            )
          }
        />
      ) : (
        FILE_HASH_ALGORITHMS.map((algorithm) => (
          <List.Item
            id={`file-${algorithm}`}
            key={algorithm}
            title={`Copy File ${algorithm.toUpperCase()}`}
            subtitle="Hash file contents on action"
            icon={Icon.Document}
            accessories={running ? [{ text: "Processing…" }] : []}
            actions={
              <ActionPanel>
                <Action
                  title={`Copy File ${algorithm.toUpperCase()}`}
                  icon={Icon.CopyClipboard}
                  onAction={() => run(algorithm)}
                />
                {inputActions}
              </ActionPanel>
            }
          />
        ))
      )}
    </List.Section>
  );
}
