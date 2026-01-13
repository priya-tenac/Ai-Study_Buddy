import { NextResponse } from "next/server"
import type pdfParseType from "pdf-parse/lib/pdf-parse.js"

const MAX_PDF_TEXT_CHARS = 60000

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Basic guard against wrong file types
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a valid PDF file." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamically import the core pdf-parse implementation to avoid running its CLI self-test
    const pdfModule = (await import("pdf-parse/lib/pdf-parse.js")) as
      | { default: typeof pdfParseType }
      | typeof pdfParseType
    const pdfParse = (pdfModule as any).default || (pdfModule as any)

    // Limit how much of the PDF we parse to avoid timeouts on huge files,
    // but allow more pages so large books are mostly covered.
    const data = await pdfParse(buffer, { max: 150 })
    let text = (data?.text || "").trim()

    if (!text) {
      return NextResponse.json(
        {
          error:
            "We couldn't extract any readable text from this PDF. It may be scanned or image-only.",
        },
        { status: 400 }
      )
    }

    // Truncate extremely large outputs so the JSON response stays within limits
    if (text.length > MAX_PDF_TEXT_CHARS) {
      text = text.slice(0, MAX_PDF_TEXT_CHARS)
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error("PDF parse error", err)
    return NextResponse.json(
      { error: "Failed to read PDF on the server." },
      { status: 500 }
    )
  }
}
