export default function float32ToWav(audioData: Float32Array, sampleRate: number = 16000) {
    const numSamples = audioData.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);  // PCM
    view.setUint16(22, 1, true);  // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // convert float32 [-1,1] to int16 PCM
    let offset = 44;
    for (let i = 0; i < numSamples; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

export async function fetchTextToSpeech(text: string): Promise<Blob> {
    const res = await fetch("/demo/api/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "TTS API error");
    }

    return await res.blob();
}

export async function fetchTranscribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "audio.wav");

    const res = await fetch("/demo/api/transcribe", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to transcribe audio");
    }

    const data = await res.json();
    return data.text || "";
}