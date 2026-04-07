/**
 * Authenticated CSV export. Data scope: `auth.getUser().id` only.
 * Ensure RLS on all queried tables matches production policies.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildCombinedExportCsv,
  buildGlucoseCsv,
  buildInsulinCsv,
  buildMealsCsv,
} from "@/lib/export/build-export-csv";
import { filenameWithDate } from "@/lib/export/csv";
import { getGlucoseEntries } from "@/lib/db/glucose";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getMealEntries } from "@/lib/db/meals";
import {
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
} from "@/lib/utils/glucose";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const range = parseGlucoseRangeParam(url.searchParams.get("range") ?? undefined);
  const bound = getGlucoseRangeMeasuredAtLowerBound(range);

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Требуется вход в аккаунт." },
      { status: 401 }
    );
  }

  const userId = user.id;

  const [glucose, insulin, meals] = await Promise.all([
    getGlucoseEntries(userId, { measuredAtGte: bound }),
    getInsulinEntries(userId, { takenAtGte: bound }),
    getMealEntries(userId, { eatenAtGte: bound }),
  ]);

  let body: string;
  let filename: string;

  switch (kind) {
    case "glucose":
      body = buildGlucoseCsv(glucose);
      filename = filenameWithDate("glucose", range);
      break;
    case "insulin":
      body = buildInsulinCsv(insulin);
      filename = filenameWithDate("insulin", range);
      break;
    case "meals":
      body = buildMealsCsv(meals);
      filename = filenameWithDate("meals", range);
      break;
    case "all":
      body = buildCombinedExportCsv({ glucose, insulin, meals });
      filename = filenameWithDate("diary-all", range);
      break;
    default:
      return NextResponse.json(
        { error: "Укажите kind: glucose, insulin, meals или all." },
        { status: 400 }
      );
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
