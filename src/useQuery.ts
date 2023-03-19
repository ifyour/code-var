import * as changeCase from "change-case";
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
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Translate to en: \n\n ${content}`,
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
      const text = (content?.choices?.[0]?.message?.content || "").replace(/\n/g, "").replace(/\./g, "").trim();
      result = CASES.map((type) => {
        if (type === "capitalCase") {
          return { value: changeCase[type](text.replace(/ /g, "")), type };
        }
        return { value: changeCase[type](text), type };
      });
    } catch (error) {
      result = [];
    }
    return result;
  }
}
