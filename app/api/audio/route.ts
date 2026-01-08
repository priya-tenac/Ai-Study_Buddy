import { NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 })
    }

    const transcription: any = await (groq as any).audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "json",
    })

    const text: string = transcription?.text || ""

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not transcribe audio file" },
        { status: 500 }
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error("Audio transcription error", err)
    return NextResponse.json(
      { error: "Failed to transcribe audio on the server." },
      { status: 500 }
    )
  }
}
