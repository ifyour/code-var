import { getPreferenceValues } from "@raycast/api";
import type { Preferences } from "./types";

export const PREFERENCES = getPreferenceValues<Preferences>();

export const CODE_VAR_HISTORY = "CODE_VAR_HISTORY";

export const CASES = [
  "noCase",
  "camelCase",
  "pascalCase",
  "constantCase",
  "sentenceCase",
  "dotCase",
  "headerCase",
  "paramCase",
  "pathCase",
  "snakeCase",
] as const;

export const IGNORE_WORDS = ["and", "or", "the", "a", "at", "of", "was", "an"];
