import React from "react";
import { Action, ActionPanel, List, Icon, Clipboard, showToast, Toast } from "@raycast/api";
import type { Result } from "./types";
import { queryVariableNames } from "./useQuery";

export default function Command() {
  const cancelRef = React.useRef<AbortController | null>(null);
  const [variableNames, setVariableNames] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    return () => {
      cancelRef.current?.abort();
    };
  }, []);

  const onSearchTextChange = async (searchContent: string) => {
    cancelRef.current?.abort();
    if (!searchContent) {
      setVariableNames([]);
      return;
    }
    cancelRef.current = new AbortController();
    try {
      setLoading(true);
      const result = await queryVariableNames(searchContent, cancelRef.current.signal);
      setLoading(false);
      setVariableNames(result);
    } catch (error: unknown) {
      if (!String(error).startsWith("AbortError")) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: (error as Error)?.message,
        });
      }
      setVariableNames([]);
    }
  };

  return (
    <List
      isLoading={loading}
      onSearchTextChange={onSearchTextChange}
      searchBarPlaceholder="Please enter variable name"
      throttle
    >
      {variableNames.map((variableName) => (
        <List.Item
          key={variableName.type}
          title={variableName.value}
          subtitle={variableName.type}
          icon={Icon.Stars}
          actions={
            <ActionPanel>
              <ActionPanel.Section>
                <Action.CopyToClipboard title="Copy to Clipboard" content={variableName.value} />
                <Action
                  title="Copy and Paste"
                  onAction={() => Clipboard.paste(variableName.value)}
                  icon={{ source: Icon.CopyClipboard }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
