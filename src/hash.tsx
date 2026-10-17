import { withClipboardInput, type InitialInputProps } from "./components/with-clipboard-input";
import { readClipboardInput } from "./utils/clipboard";
import { TextTransformCommand } from "./components/text-transform-command";
import { hashUtils } from "./utils/encoding";

const transforms = Object.entries(hashUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

function Command(props: InitialInputProps) {
  return <TextTransformCommand {...props} operation="hash" transforms={transforms} />;
}

export default withClipboardInput(Command, readClipboardInput);
