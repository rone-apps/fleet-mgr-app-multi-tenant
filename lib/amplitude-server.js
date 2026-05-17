import { createInstance } from "@amplitude/analytics-node";

let amplitudeClient = null;

export function getAmplitudeClient() {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return null;

  if (!amplitudeClient) {
    amplitudeClient = createInstance();
    amplitudeClient.init(apiKey);
  }
  return amplitudeClient;
}

export async function flushAmplitude() {
  if (amplitudeClient) {
    await amplitudeClient.flush();
  }
}
