export type Mode =
  | "overview"
  | "attendance"
  | "status"
  | "program"
  | "nationality"
  | "department"
  | "grade"
  | "programNationality"
  | "certification"
  | "insurance"
  | "topik"
  | "dropout"
  | "counseling";

export const dashboardModes = new Set<Mode>([
  "overview",
  "attendance",
  "status",
  "program",
  "nationality",
  "department",
  "grade",
  "programNationality",
  "certification",
  "insurance",
  "topik",
  "dropout",
  "counseling",
]);
