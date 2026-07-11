import { PDFParse } from "pdf-parse";

const MIN_MEANINGFUL_CHARS = 40;

export interface PdfTextResult {
  text: string | null;
  /** true when the PDF parsed but has no real text layer (e.g. scanned/image-only) */
  noTextLayer: boolean;
  /** true when the file could not be parsed as a PDF at all */
  failed: boolean;
}

export async function extractPdfText(buffer: Buffer): Promise<PdfTextResult> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    if (text.length < MIN_MEANINGFUL_CHARS) {
      return { text: null, noTextLayer: true, failed: false };
    }
    return { text, noTextLayer: false, failed: false };
  } catch {
    return { text: null, noTextLayer: false, failed: true };
  } finally {
    if (parser) await parser.destroy();
  }
}
