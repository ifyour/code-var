import * as changeCase from "change-case";
import { LocalStorage, getPreferenceValues, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";

import { CASES, CODE_VAR_HISTORY } from "./constants";
import type { Result, ChatCompletion } from "./types";

export async function getHistory(queryText: string): Promise<Result[]> {
  const historyString = (await LocalStorage.getItem(`${CODE_VAR_HISTORY}_${queryText}`)) as string;
  if (historyString === undefined) return [];
  const items: Result[] = JSON.parse(historyString);
  return items;
}

export async function deleteAllHistory() {
  await LocalStorage.clear();
  showToast({
    style: Toast.Style.Success,
    title: "Success",
    message: "Cleared search history",
  });
}

export async function deleteHistoryItem(result: Result) {
  await LocalStorage.removeItem(`${CODE_VAR_HISTORY}_${result.query}`);
  showToast({
    style: Toast.Style.Success,
    title: "Success",
    message: "Removed from history",
  });
}

export async function queryVariableNames(queryText: string, signal?: AbortSignal): Promise<Result[]> {
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
          content: `Translate to en (variable name): \n\n ${queryText}`,
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
      result = CASES.map((caseType) => ({ value: changeCase[caseType](text), type: caseType }));
    } catch (error) {
      result = [];
    }

    if (queryText && result.length > 0) {
      await LocalStorage.setItem(
        `${CODE_VAR_HISTORY}_${queryText}`,
        JSON.stringify(result.map((item) => ({ ...item, query: queryText })))
      );
    }

    return result;
  }
}
