import { NextResponse } from "next/server";

// Mints a short-lived (15 min), single-use token for ElevenLabs' realtime
// Scribe speech-to-text WebSocket, so the browser can connect directly to
// wss://api.elevenlabs.io without ever seeing the real API key.
export async function POST() {
  try {
    const apiKey = process.env.VOICE_AI_KEY || 'f22ac8e5743c6e0d8149a9e00e2e779f7ad8cb8f07b5163cdd94ef18a952a38c';

    if (!apiKey) {
      return NextResponse.json(
        { error: "VOICE_AI_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: { "xi-api-key": apiKey },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      let message = errText;
      try {
        const parsed = JSON.parse(errText);
        message = parsed?.detail?.message || parsed?.detail || message;
      } catch (_) { }

      if (response.status === 401) {
        message = "Voice service is out of credits for this billing period. " + message;
      }

      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
