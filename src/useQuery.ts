import { LocalStorage, getPreferenceValues } from "@raycast/api";
import fetch from "node-fetch";
import { CASES } from "./constants";
import type { Result, ChatCompletion } from "./types";

// todo：Return results directly from query history
export async function getSearchHistory(): Promise<Result[]> {
  const historyString = (await LocalStorage.getItem("history")) as string;
  if (historyString === undefined) return [];
  const items: Result[] = JSON.parse(historyString);
  return items;
}

export async function queryVariableNames(content: string, signal?: AbortSignal): Promise<Result[]> {
  const { entrypoint, apiKey } = getPreferenceValues<{ entrypoint: string; apiKey: string }>();

  const response = await fetch(entrypoint, {
    method: "POST",
    signal: signal,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // https://platform.openai.com/docs/api-reference/chat/create
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Translate variable names into English and apply naming conventions: ${CASES.join(",")}.
           Save the result in the format: [{value: 'result', type: 'convention'}]. Serialize the output without any explanation.
           The string to be translated is "${content}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return Promise.reject(response.statusText);
  } else {
    const content = (await response.json()) as ChatCompletion;
    let result: Result[] = [];
    try {
      result = JSON.parse(content?.choices?.[0]?.message?.content);
    } catch (error) {
      result = [];
    }
    return result;
  }
}
