import { TextTransformCommand } from "./components/text-transform-command";
import { hashUtils } from "./utils/encoding";

const transforms = Object.entries(hashUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

export default function Command() {
  return <TextTransformCommand operation="hash" transforms={transforms} />;
}
