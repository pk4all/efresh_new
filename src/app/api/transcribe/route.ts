import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio_file") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided in the request." },
        { status: 400 }
      );
    }

    const apiKey = process.env.VOICE_AI_KEY || 'f22ac8e5743c6e0d8149a9e00e2e779f7ad8cb8f07b5163cdd94ef18a952a38c';

    if (!apiKey) {
      return NextResponse.json(
        { error: "VOICE_AI_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Forward to ElevenLabs Speech-to-Text API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append("file", audioFile);
    elevenLabsFormData.append("model_id", "scribe_v2");
    elevenLabsFormData.append("language", "en");
    elevenLabsFormData.append("filter_background_audio", "true");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(data, 'res')
    return NextResponse.json({ text: data.text || "" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
