import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, StrictMode, useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { withClipboardInput, type InitialInputProps } from "../src/components/with-clipboard-input.ts";
import { datetimeUtils } from "../src/utils/datetime.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Input({ initialText }: InitialInputProps) {
  const [value, setValue] = useState(initialText);
  return createElement("input", { value, onChange: (event) => setValue(event.target.value) });
}

test("initial clipboard read runs once across StrictMode replay and never overwrites edited input", async () => {
  const deferred = Promise.withResolvers<string>();
  let reads = 0;
  const Command = withClipboardInput(Input, () => {
    reads++;
    return deferred.promise;
  });
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(createElement(StrictMode, null, createElement(Command)));
  });
  assert.equal(reads, 1);
  assert.equal(view.toJSON(), null, "do not mount an empty input before the clipboard is ready");

  await act(async () => deferred.resolve("hello world"));
  assert.equal(view.root.findByType("input").props.value, "hello world");
  await act(async () => view.root.findByType("input").props.onChange({ target: { value: "replacement" } }));
  await act(async () => view.update(createElement(StrictMode, null, createElement(Command))));
  assert.equal(view.root.findByType("input").props.value, "replacement");
  assert.equal(reads, 1);
  await act(async () => view.unmount());

  await act(async () => {
    view = create(createElement(StrictMode, null, createElement(Command)));
  });
  assert.equal(reads, 2, "entering the tool again reads the clipboard again");
  await act(async () => view.unmount());
});

test("closing a tool before clipboard resolution does not mount its input later", async () => {
  const deferred = Promise.withResolvers<string>();
  let renders = 0;
  const Command = withClipboardInput(
    () => {
      renders++;
      return null;
    },
    () => deferred.promise,
  );
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(createElement(Command));
  });
  await act(async () => view.unmount());
  await act(async () => deferred.resolve("late clipboard text"));
  assert.equal(renders, 0);
});

for (const [name, read] of [
  ["empty", async () => ""],
  ["unavailable", async () => undefined],
  [
    "failed",
    async () => {
      throw new Error("clipboard unavailable");
    },
  ],
] as const) {
  test(`${name} clipboard opens an empty editable input`, async () => {
    const Command = withClipboardInput(Input, read);
    let view!: ReactTestRenderer;
    await act(async () => {
      view = create(createElement(Command));
    });
    assert.equal(view.root.findByType("input").props.value, "");
    await act(async () => view.root.findByType("input").props.onChange({ target: { value: "new input" } }));
    assert.equal(view.root.findByType("input").props.value, "new input");
    await act(async () => view.unmount());
  });
}

test("clipboard initialization preserves complete multiline Unicode text", async () => {
  const input = "中文🙂\n\t".repeat(100_000) + "END";
  const Command = withClipboardInput(Input, async () => input);
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(createElement(Command));
  });
  assert.equal(view.root.findByType("input").props.value, input);
  await act(async () => view.unmount());
});

test("file clipboard metadata survives initialization without turning plain text into a file", async () => {
  let reads = 0;
  const Command = withClipboardInput(
    (props: InitialInputProps) => createElement("input", props),
    async () => {
      reads++;
      return { text: "/tmp/中文 file.png", files: ["/tmp/中文 file.png"] };
    },
  );
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(createElement(StrictMode, null, createElement(Command)));
  });
  assert.equal(reads, 1);
  assert.equal(view.root.findByType("input").props.initialText, "/tmp/中文 file.png");
  assert.deepEqual(view.root.findByType("input").props.initialFiles, ["/tmp/中文 file.png"]);
  await act(async () => view.unmount());
});

test("arbitrary clipboard timestamps outside the date range return an error instead of crashing", () => {
  for (const value of ["9".repeat(100_000), "8640000000000001"]) {
    assert.equal(datetimeUtils.timestampToDate(value), "Invalid timestamp");
  }
  assert.equal(datetimeUtils.timestampToDate("0"), "1970-01-01T00:00:00.000Z");
});
