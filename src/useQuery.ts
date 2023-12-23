import fetch from "node-fetch";
import * as changeCase from "change-case";
import { LocalStorage, showToast, Toast } from "@raycast/api";

import type { Result, Response } from "./types";
import { CASES, CODE_VAR_HISTORY, PREFERENCES, IGNORE_WORDS } from "./constants";

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

async function queryByTencent(text: string, signal?: AbortSignal) {
  let result = "";
  try {
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
          text_block: text,
          lang: "zh",
        },
        target: {
          lang: "en",
        },
      }),
    });
    if (response.ok) {
      const content = (await response.json()) as Response;
      result = content.auto_translation ?? "";
    }
  } catch (error) {
    result = "";
  }
  return result;
}

async function queryByGoogle(text: string, signal?: AbortSignal) {
  let result = "";
  try {
    const response = await fetch("https://deeplx.mingming.dev/translate?key=x", {
      method: "POST",
      signal: signal,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        text,
        source_lang: "zh",
        target_lang: "en",
      }),
    });
    if (response.ok) {
      const content = (await response.json()) as { code: number; data: string; message: string };
      result = content.data ?? "";
    }
  } catch (error) {
    result = "";
  }
  return result;
}

export async function queryVariableNames(queryText: string, signal?: AbortSignal): Promise<Result[]> {
  let result: Result[] = [];

  const translationResults =
    PREFERENCES.translateSource === "google"
      ? await queryByGoogle(queryText, signal)
      : await queryByTencent(queryText, signal);

  try {
    const variableNames = translationResults
      .replace(/\n/g, "")
      .replace(/\./g, "")
      .trim()
      .split(" ")
      .filter((word) => !IGNORE_WORDS.includes(word))
      .join(" ");
    result = [
      { value: translationResults ?? "", type: "original" },
      ...CASES.map((caseType) => ({ value: changeCase[caseType](variableNames), type: caseType })),
    ];
  } catch (error) {
    result = [];
  }

  if (PREFERENCES.isEnableCache === "1" && queryText && result.length > 0) {
    await LocalStorage.setItem(
      `${CODE_VAR_HISTORY}_${queryText}`,
      JSON.stringify(result.map((item) => ({ ...item, query: queryText })))
    );
  }

  return result;
}
