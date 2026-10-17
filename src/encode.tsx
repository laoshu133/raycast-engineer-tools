import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardText } from "./utils/clipboard";
import { TextTransformCommand } from "./components/text-transform-command";
import { encodeUtils } from "./utils/encoding";

const transforms = Object.entries(encodeUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

function Command({ initialText }: InitialInputProps) {
  return <TextTransformCommand initialText={initialText} operation="encode" transforms={transforms} />;
}

export default withClipboardInput(Command, readClipboardText);
