import { useEffect, useMemo, useState } from "react";
import { fileCandidate, fileError, inspectFile, type InputFile } from "../utils/file-input";

type State = { path: string; file?: InputFile; error?: string };

export function useFileInput(text: string, files: string[] | undefined, enabled: boolean) {
  const candidate = useMemo(() => (enabled ? fileCandidate(text, files) : undefined), [text, files, enabled]);
  const [state, setState] = useState<State>();
  useEffect(() => {
    let active = true;
    if (candidate?.path) {
      const path = candidate.path;
      inspectFile(path).then(
        (file) => {
          if (active) setState({ path, file });
        },
        (error) => {
          // A URL path such as /api/users is still ordinary text unless it
          // identifies a file. Native clipboard file URLs are explicit input.
          const code = (error as NodeJS.ErrnoException).code;
          const ordinaryText = !files?.length && ["ENOENT", "ENOTDIR", "ENOTFILE"].includes(code ?? "");
          if (active) setState({ path, error: ordinaryText ? undefined : fileError(error) });
        },
      );
    }
    return () => {
      active = false;
    };
  }, [candidate]);
  if (!candidate) return { checking: false };
  if (candidate.error) return { checking: false, error: candidate.error };
  if (state?.path !== candidate.path) return { checking: true };
  return { checking: false, file: state?.file, error: state?.error };
}
