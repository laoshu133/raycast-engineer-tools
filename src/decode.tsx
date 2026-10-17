import { TextTransformCommand } from "./components/text-transform-command";
import { decodeUtils } from "./utils/encoding";

const transforms = Object.entries(decodeUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

export default function Command() {
  return <TextTransformCommand operation="decode" transforms={transforms} />;
}
