/**
 * Authenticated PDF diary report. Data scope: `auth.getUser().id` only.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildReportPdfBuffer } from "@/lib/export/build-report-pdf";
import { pdfReportFilename } from "@/lib/export/csv";
import { getGlucoseEntries } from "@/lib/db/glucose";
import { getInsulinEntries } from "@/lib/db/insulin";
import { getMealEntries } from "@/lib/db/meals";
import { getUserSettings } from "@/lib/db/settings";
import {
  getGlucoseRangeMeasuredAtLowerBound,
  parseGlucoseRangeParam,
  getGlucoseStats,
} from "@/lib/utils/glucose";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = parseGlucoseRangeParam(url.searchParams.get("range") ?? undefined);

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
  const settings = await getUserSettings(userId);
  const bound = getGlucoseRangeMeasuredAtLowerBound(range, {
    timezone: settings.timezone,
  });

  const [glucoseEntries, insulinEntries, meals] = await Promise.all([
    getGlucoseEntries(userId, { measuredAtGte: bound }),
    getInsulinEntries(userId, { takenAtGte: bound }),
    getMealEntries(userId, { eatenAtGte: bound }),
  ]);

  const glucoseStats = getGlucoseStats(glucoseEntries, settings);

  try {
    const buffer = await buildReportPdfBuffer({
      rangeKey: range,
      generatedAt: new Date(),
      glucoseStats,
      glucoseEntries,
      insulinEntries,
      meals,
    });

    const filename = pdfReportFilename(range);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export/pdf]", e);
    return NextResponse.json(
      {
        error:
          "Не удалось сформировать PDF. Проверьте, что шрифты на месте (см. src/lib/export/fonts).",
      },
      { status: 500 }
    );
  }
}
