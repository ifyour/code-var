import type { CASES } from "./constants";

export interface Result {
  value: string;
  type: (typeof CASES)[number] | "original";
  query?: string;
}

export interface Response {
  header: {
    type: string;
    ret_code: string;
    time_cost: number;
    request_id: string;
  };
  auto_translation: string;
}

export interface Preferences {
  translateSource: "google" | "tencent";
  isEnableCache: "0" | "1";
}
