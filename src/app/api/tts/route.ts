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
    //const voiceId = "pg7Nd5b8Y3tnfSndq5lh";
    const voiceId = 'LtPsVjX1k0Kl4StEMZPK';
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
            stability: 0.4,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
            // Max supported pace for this voice/model - keeps delivery brisk
            // and conversational instead of a slow, over-enunciated read.
            speed: 1.2,
          },
        }),
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

      return NextResponse.json(
        { error: message },
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


