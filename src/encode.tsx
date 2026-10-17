import { TextTransformCommand } from "./components/text-transform-command";
import { encodeUtils } from "./utils/encoding";

const transforms = Object.entries(encodeUtils).map(([method, transform]) => ({
  method: method.toUpperCase(),
  transform,
}));

export default function Command() {
  return <TextTransformCommand operation="encode" transforms={transforms} />;
}
