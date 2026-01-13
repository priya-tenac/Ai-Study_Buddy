import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { exec } from "child_process"

// Uses edge-tts (Microsoft Edge TTS CLI) for local TTS. You can replace with another TTS if needed.
export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { text, lang = "en" } = await req.json()
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }
    // Generate a unique filename
    const filename = `tts-${uuidv4()}.mp3`
    const outPath = path.join("/tmp", filename)
    // Use edge-tts CLI (must be installed: npm i -g edge-tts)
    const command = `edge-tts --text "${text.replace(/"/g, '')}" --write-media ${outPath} --voice ${lang === "hi" ? "hi-IN-SwaraNeural" : lang === "ur" ? "ur-PK-AsadNeural" : lang === "es" ? "es-ES-ElviraNeural" : lang === "de" ? "de-DE-KatjaNeural" : "en-US-AriaNeural"}`
    await new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error)
        else resolve(null)
      })
    })
    const audio = await fs.readFile(outPath)
    await fs.unlink(outPath)
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename=summary.mp3`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: "TTS failed" }, { status: 500 })
  }
}
