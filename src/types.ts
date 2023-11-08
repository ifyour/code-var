import type { CASES } from "./constants";

export interface Result {
  value: string;
  type: (typeof CASES)[number];
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
