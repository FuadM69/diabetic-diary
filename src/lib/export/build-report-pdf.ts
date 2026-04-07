/**
 * Server-side PDF report (A4 portrait, print-friendly).
 * Requires TTF fonts under `src/lib/export/fonts/` (Noto Sans, OFL) for Cyrillic.
 */
import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";

type PdfDoc = InstanceType<typeof PDFDocument>;
import type { GlucoseEntry, GlucoseRangeKey, GlucoseStats } from "@/lib/types/glucose";
import type { InsulinEntry } from "@/lib/types/insulin";
import type { MealEntryWithItems } from "@/lib/types/meal";
import { MEAL_TYPE_LABEL_RU, type MealTypeKey } from "@/lib/types/meal";
import {
  formatGlucoseDate,
  formatGlucoseValue,
  GLUCOSE_RANGE_LABEL,
} from "@/lib/utils/glucose";
import { INSULIN_ENTRY_TYPE_LABEL_RU } from "@/lib/utils/insulin";
import { formatInsulinUnits } from "@/lib/utils/insulin";
import { sumCaloriesFromItems, sumCarbsFromItems } from "@/lib/utils/meal-nutrition";

const FONTS_DIR = path.join(process.cwd(), "src/lib/export/fonts");
const FONT_REG = path.join(FONTS_DIR, "NotoSans-Regular.ttf");
const FONT_BOLD = path.join(FONTS_DIR, "NotoSans-Bold.ttf");

/** Limits keep PDFs bounded for very large histories. */
const MAX_GLUCOSE_ROWS = 55;
const MAX_INSULIN_ROWS = 55;
const MAX_MEAL_ROWS = 45;

const MARGIN = 48;
const FOOTER_CLEAR = 72;

export type BuildReportPdfParams = {
  rangeKey: GlucoseRangeKey;
  generatedAt: Date;
  glucoseStats: GlucoseStats;
  glucoseEntries: GlucoseEntry[];
  insulinEntries: InsulinEntry[];
  meals: MealEntryWithItems[];
};

function mealTypeLabel(mealType: string): string {
  return mealType in MEAL_TYPE_LABEL_RU
    ? MEAL_TYPE_LABEL_RU[mealType as MealTypeKey]
    : mealType;
}

function truncateCell(s: string | null | undefined, max: number): string {
  if (s == null || s === "") {
    return "—";
  }
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

function ensureFonts(): void {
  if (!fs.existsSync(FONT_REG) || !fs.existsSync(FONT_BOLD)) {
    throw new Error(
      `PDF fonts missing. Expected Noto Sans TTF files in ${FONTS_DIR}`
    );
  }
}

function pageBreakIfNeeded(doc: PdfDoc, minSpace: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom - minSpace;
  if (doc.y > bottom) {
    doc.addPage();
  }
}

function heading(doc: PdfDoc, title: string): void {
  pageBreakIfNeeded(doc, FOOTER_CLEAR);
  doc.font("Report-Bold").fontSize(12).fillColor("#111111").text(title);
  doc.moveDown(0.35);
  doc.font("Report").fontSize(9.5).fillColor("#222222");
}

function noDataLine(doc: PdfDoc): void {
  doc.font("Report").fontSize(9.5).fillColor("#444444").text("Нет данных.");
  doc.moveDown(0.6);
}

function writeMeta(
  doc: PdfDoc,
  rangeKey: GlucoseRangeKey,
  generatedAt: Date
): void {
  doc.font("Report-Bold").fontSize(15).fillColor("#111111");
  doc.text("Отчёт дневника", { align: "center" });
  doc.moveDown(0.5);
  doc.font("Report").fontSize(10).fillColor("#222222");
  const gen = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(generatedAt);
  doc.text(`Период: ${GLUCOSE_RANGE_LABEL[rangeKey]}`);
  doc.text(`Дата формирования: ${gen}`);
  doc.moveDown(0.9);
}

function writeGlucoseSummary(doc: PdfDoc, stats: GlucoseStats): void {
  heading(doc, "Сводка по глюкозе");
  if (stats.isEmpty) {
    noDataLine(doc);
    return;
  }
  doc.text(`Среднее значение: ${stats.average}`);
  doc.text(`Минимум: ${stats.min}     Максимум: ${stats.max}`);
  doc.text(
    `В целевом диапазоне: ${stats.inRangePercent}% (замеров: ${stats.totalCount})`
  );
  doc.moveDown(0.7);
}

function writeGlucoseTable(doc: PdfDoc, entries: GlucoseEntry[]): void {
  heading(doc, "Замеры глюкозы (недавние)");
  if (entries.length === 0) {
    noDataLine(doc);
    return;
  }

  const total = entries.length;
  const slice = entries.slice(0, MAX_GLUCOSE_ROWS);
  if (total > MAX_GLUCOSE_ROWS) {
    doc.font("Report").fontSize(8.5).fillColor("#555555");
    doc.text(
      `Показаны первые ${MAX_GLUCOSE_ROWS} из ${total} записей за период.`,
      { lineGap: 2 }
    );
    doc.moveDown(0.35);
    doc.font("Report").fontSize(9.5).fillColor("#222222");
  }

  doc
    .font("Report-Bold")
    .fontSize(8.8)
    .text("Дата и время   Значение   Примечание");

  doc.font("Report").fontSize(9);
  for (const e of slice) {
    pageBreakIfNeeded(doc, 36);
    const line = `${formatGlucoseDate(e.measured_at)}   ${formatGlucoseValue(
      e.glucose_value
    )}   ${truncateCell(e.note, 55)}`;
    doc.text(line, { width: doc.page.width - MARGIN * 2, lineGap: 1 });
  }
  doc.moveDown(0.6);
}

function writeInsulinTable(doc: PdfDoc, entries: InsulinEntry[]): void {
  heading(doc, "Инсулин");
  if (entries.length === 0) {
    noDataLine(doc);
    return;
  }

  const total = entries.length;
  const slice = entries.slice(0, MAX_INSULIN_ROWS);
  if (total > MAX_INSULIN_ROWS) {
    doc.font("Report").fontSize(8.5).fillColor("#555555");
    doc.text(
      `Показаны первые ${MAX_INSULIN_ROWS} из ${total} записей за период.`,
      { lineGap: 2 }
    );
    doc.moveDown(0.35);
    doc.font("Report").fontSize(9.5).fillColor("#222222");
  }

  doc
    .font("Report-Bold")
    .fontSize(8.8)
    .text("Дата и время   Препарат · тип · доза · примечание");

  doc.font("Report").fontSize(9);
  for (const e of slice) {
    pageBreakIfNeeded(doc, 36);
    const typeRu = INSULIN_ENTRY_TYPE_LABEL_RU[e.entry_type];
    const line = `${formatGlucoseDate(e.taken_at)}   ${truncateCell(
      e.insulin_name,
      24
    )} · ${typeRu} · ${formatInsulinUnits(e.units)} ед.   ${truncateCell(
      e.note,
      40
    )}`;
    doc.text(line, { width: doc.page.width - MARGIN * 2, lineGap: 1 });
  }
  doc.moveDown(0.6);
}

function writeMealsTable(doc: PdfDoc, meals: MealEntryWithItems[]): void {
  heading(doc, "Приёмы пищи (сводка)");
  if (meals.length === 0) {
    noDataLine(doc);
    return;
  }

  const total = meals.length;
  const slice = meals.slice(0, MAX_MEAL_ROWS);
  if (total > MAX_MEAL_ROWS) {
    doc.font("Report").fontSize(8.5).fillColor("#555555");
    doc.text(
      `Показаны первые ${MAX_MEAL_ROWS} из ${total} приёмов за период.`,
      { lineGap: 2 }
    );
    doc.moveDown(0.35);
    doc.font("Report").fontSize(9.5).fillColor("#222222");
  }

  doc
    .font("Report-Bold")
    .fontSize(8.8)
    .text("Дата и время   Тип · углеводы · ккал · примечание");

  doc.font("Report").fontSize(9);
  for (const m of slice) {
    pageBreakIfNeeded(doc, 36);
    const carbs = sumCarbsFromItems(m.meal_items);
    const kcal = sumCaloriesFromItems(m.meal_items);
    const line = `${formatGlucoseDate(m.eaten_at)}   ${mealTypeLabel(
      m.meal_type
    )} · ${carbs} г УК · ${kcal} ккал   ${truncateCell(m.note, 36)}`;
    doc.text(line, { width: doc.page.width - MARGIN * 2, lineGap: 1 });
  }
  doc.moveDown(0.5);
}

function writeFooter(doc: PdfDoc): void {
  pageBreakIfNeeded(doc, 48);
  doc.moveDown(0.4);
  doc.font("Report").fontSize(8).fillColor("#666666");
  doc.text(
    "Данные носят справочный характер. Для решений по лечению обращайтесь к врачу.",
    { align: "center", width: doc.page.width - MARGIN * 2 }
  );
}

function renderReport(doc: PdfDoc, params: BuildReportPdfParams): void {
  const {
    rangeKey,
    generatedAt,
    glucoseStats,
    glucoseEntries,
    insulinEntries,
    meals,
  } = params;

  doc.registerFont("Report", FONT_REG);
  doc.registerFont("Report-Bold", FONT_BOLD);

  writeMeta(doc, rangeKey, generatedAt);
  writeGlucoseSummary(doc, glucoseStats);
  writeGlucoseTable(doc, glucoseEntries);
  writeInsulinTable(doc, insulinEntries);
  writeMealsTable(doc, meals);
  writeFooter(doc);
}

export function buildReportPdfBuffer(
  params: BuildReportPdfParams
): Promise<Buffer> {
  ensureFonts();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: "Отчёт дневника",
        Author: "Diabetic Diary",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      renderReport(doc, params);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    doc.end();
  });
}
