import { NextResponse } from "next/server"

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file." },
        { status: 400 },
      )
    }

    const apiKey = process.env.OCR_SPACE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OCR backend is not configured. Please set OCR_SPACE_API_KEY in your environment to enable image OCR.",
        },
        { status: 500 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const mime = file.type || "image/png"

    const params = new URLSearchParams()
    params.append("apikey", apiKey)
    params.append("language", "eng")
    params.append("isOverlayRequired", "false")
    params.append("OCREngine", "2")
    params.append("base64Image", `data:${mime};base64,${base64}`)

    const resp = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!resp.ok) {
      console.error("OCR.space HTTP error", resp.status, resp.statusText)
      return NextResponse.json({ error: "Image OCR request failed." }, { status: 502 })
    }

    const data: any = await resp.json()

    if (data.IsErroredOnProcessing) {
      const msg =
        (Array.isArray(data.ErrorMessage) && data.ErrorMessage.join("; ")) ||
        data.ErrorMessage ||
        "Image OCR processing error."
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const results = Array.isArray(data.ParsedResults) ? data.ParsedResults : []
    const text =
      results.length > 0 && typeof results[0].ParsedText === "string"
        ? (results[0].ParsedText as string).trim()
        : ""

    if (!text) {
      return NextResponse.json(
        { error: "No readable text detected in this image." },
        { status: 400 },
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error("OCR API error", err)
    return NextResponse.json(
      { error: "Image OCR failed on the server." },
      { status: 500 },
    )
  }
}
