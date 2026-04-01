import "server-only";

import Papa from "papaparse";

export type ParsedCSV = {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
};

export type ColumnTypeSuggestion = {
  columnName: string;
  suggestedType: "number" | "percent" | "currency" | "text" | "date" | "status" | "tag" | "link" | "boolean";
  confidence: "high" | "medium" | "low";
  sampleValues: string[];
};

/** Parse a CSV string into headers and rows */
export function parseCSVString(content: string): ParsedCSV {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
    totalRows: result.data.length,
  };
}

/** Detect likely FieldType for each column by sampling values */
export function detectColumnTypes(
  headers: string[],
  rows: Record<string, string>[],
): ColumnTypeSuggestion[] {
  const sampleSize = Math.min(rows.length, 20);
  const sample = rows.slice(0, sampleSize);

  return headers.map((col) => {
    const values = sample.map((r) => r[col] ?? "").filter((v) => v !== "");
    return {
      columnName: col,
      ...inferType(col, values),
      sampleValues: values.slice(0, 3),
    };
  });
}

function inferType(
  colName: string,
  values: string[],
): { suggestedType: ColumnTypeSuggestion["suggestedType"]; confidence: ColumnTypeSuggestion["confidence"] } {
  if (values.length === 0) return { suggestedType: "text", confidence: "low" };

  const lowerCol = colName.toLowerCase();

  // URL/link detection
  if (lowerCol.includes("url") || lowerCol.includes("link") || lowerCol.includes("href")) {
    return { suggestedType: "link", confidence: "high" };
  }

  // Date detection
  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
  if (
    values.every((v) => datePattern.test(v)) ||
    lowerCol.includes("date") ||
    lowerCol.includes("_at")
  ) {
    return { suggestedType: "date", confidence: "high" };
  }

  // Boolean detection
  const boolValues = new Set(["true", "false", "yes", "no", "1", "0"]);
  if (values.every((v) => boolValues.has(v.toLowerCase()))) {
    return { suggestedType: "boolean", confidence: "high" };
  }

  // Currency detection
  const currencyPattern = /^\$[\d,]+(\.\d{2})?$|^[\d,]+\.\d{2}$/;
  if (
    values.some((v) => currencyPattern.test(v)) ||
    lowerCol.includes("revenue") ||
    lowerCol.includes("cost") ||
    lowerCol.includes("price") ||
    lowerCol.includes("amount")
  ) {
    return { suggestedType: "currency", confidence: "medium" };
  }

  // Percent detection
  if (
    values.some((v) => v.endsWith("%")) ||
    lowerCol.includes("rate") ||
    lowerCol.includes("pct") ||
    lowerCol.includes("percent")
  ) {
    return { suggestedType: "percent", confidence: "medium" };
  }

  // Number detection
  const numericPattern = /^[\d,]+(\.\d+)?$/;
  if (values.every((v) => numericPattern.test(v.replace(/[$%,]/g, "")))) {
    return { suggestedType: "number", confidence: "high" };
  }

  // Status detection (few unique repeated values)
  const uniqueValues = new Set(values);
  if (uniqueValues.size <= 5 && values.length > 3) {
    return { suggestedType: "status", confidence: "medium" };
  }

  return { suggestedType: "text", confidence: "high" };
}
