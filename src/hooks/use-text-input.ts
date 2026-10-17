import { useRef, useState } from "react";
import { SEARCH_INPUT_LIMIT, SEARCH_PREVIEW_LENGTH } from "../utils/text-preview";

function searchValue(text: string): string {
  return text.length > SEARCH_PREVIEW_LENGTH || /[\r\n]/.test(text) ? "" : text;
}

export function useTextInput(initialText: string) {
  const [text, setText] = useState(initialText);
  const [searchText, setSearchText] = useState(() => searchValue(initialText));
  const [searchLimitReached, setSearchLimitReached] = useState(false);
  const revision = useRef(0);
  const nativeSearchText = useRef(searchValue(initialText));
  const expectedSearchEcho = useRef<string | undefined>(searchValue(initialText));

  const setInput = (value: string, imported = false) => {
    revision.current++;
    setText(value);
    setSearchLimitReached(!imported && value.length >= SEARCH_INPUT_LIMIT);
    // Keep complete large/multiline values outside the bounded search field.
    const displayed = searchValue(value);
    if (displayed !== nativeSearchText.current) expectedSearchEcho.current = displayed;
    nativeSearchText.current = displayed;
    setSearchText(displayed);
  };

  const onSearchTextChange = (value: string) => {
    nativeSearchText.current = value;
    if (value === expectedSearchEcho.current) {
      expectedSearchEcho.current = undefined;
      return;
    }
    expectedSearchEcho.current = undefined;
    setInput(value);
  };

  return { text, searchText, setInput, onSearchTextChange, searchLimitReached, revision };
}
