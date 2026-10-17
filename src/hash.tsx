import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardText } from "./utils/clipboard";
import { TextTransformCommand } from "./components/text-transform-command";
import { hashUtils } from "./utils/encoding";

const transforms = Object.entries(hashUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

function Command({ initialText }: InitialInputProps) {
  return <TextTransformCommand initialText={initialText} operation="hash" transforms={transforms} />;
}

export default withClipboardInput(Command, readClipboardText);
