export type GoogleSheetValuesResult = {
  loadedAt: string;
  range: string;
  spreadsheetId: string;
  values: string[][];
};

export class GoogleSheetValuesError extends Error {
  code: "missing_api_key" | "request_failed";
  status?: number;

  constructor(code: "missing_api_key" | "request_failed", message: string, status?: number) {
    super(message);
    this.name = "GoogleSheetValuesError";
    this.code = code;
    this.status = status;
  }
}

export async function fetchGoogleSheetValues({
  range,
  spreadsheetId,
}: {
  range: string;
  spreadsheetId: string;
}): Promise<GoogleSheetValuesResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    throw new GoogleSheetValuesError(
      "missing_api_key",
      "Google Sheets API key is not configured.",
    );
  }

  const normalizedRange = range.trim() || "Form Responses 1!A:Z";
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}/values/${encodeURIComponent(normalizedRange)}`,
  );
  url.searchParams.set("majorDimension", "ROWS");
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new GoogleSheetValuesError(
      "request_failed",
      `Google Sheets request failed with ${response.status}.`,
      response.status,
    );
  }

  const payload = (await response.json()) as { values?: unknown[][] };
  const values = (payload.values ?? []).map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))),
  );

  return {
    loadedAt: new Date().toISOString(),
    range: normalizedRange,
    spreadsheetId,
    values,
  };
}
