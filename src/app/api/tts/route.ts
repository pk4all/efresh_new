import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.VOICE_AI_KEY || 'f22ac8e5743c6e0d8149a9e00e2e779f7ad8cb8f07b5163cdd94ef18a952a38c';

    if (!apiKey) {
      return NextResponse.json(
        { error: "VOICE_AI_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // ElevenLabs Rachel Voice ID
    const voiceId = "pg7Nd5b8Y3tnfSndq5lh";
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
