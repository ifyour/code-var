import * as changeCase from "change-case";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";

import { CASES, CODE_VAR_HISTORY } from "./constants";
import type { Result, Response } from "./types";

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
  const response = await fetch("https://transmart.qq.com/api/imt", {
    method: "POST",
    signal: signal,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      header: {
        fn: "auto_translation_block",
        client_key:
          "dHJhbnNtYXJ0X2NyeF9Nb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81",
      },
      source: {
        text_block: queryText,
        lang: "zh",
      },
      target: {
        lang: "en",
      },
    }),
  });

  if (!response.ok) {
    return Promise.reject(response.statusText);
  } else {
    let result: Result[] = [];
    const content = (await response.json()) as Response;
    try {
      const text = (content.auto_translation || "").replace(/\n/g, "").replace(/\./g, "").trim();
      result = CASES.map((caseType) => ({ value: changeCase[caseType](text), type: caseType }));
    } catch (error) {
      result = [];
    }
    return result;
  }
}
