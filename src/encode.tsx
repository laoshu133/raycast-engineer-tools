import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardInput } from "./utils/clipboard";
import { TextTransformCommand } from "./components/text-transform-command";
import { encodeUtils } from "./utils/encoding";

const transforms = Object.entries(encodeUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

function Command(props: InitialInputProps) {
  return <TextTransformCommand {...props} operation="encode" transforms={transforms} />;
}

export default withClipboardInput(Command, readClipboardInput);
