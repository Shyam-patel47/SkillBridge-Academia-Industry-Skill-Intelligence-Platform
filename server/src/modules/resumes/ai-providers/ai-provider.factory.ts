import { IAIExtractionProvider } from "./ai-provider.interface.js";
import { NlpFallbackExtractionProvider } from "./nlp-fallback.provider.js";
import { GeminiExtractionProvider } from "./gemini.provider.js";

export class AIExtractionProviderFactory {
  static getProvider(): IAIExtractionProvider {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (
      geminiKey &&
      geminiKey.trim().length > 10 &&
      !geminiKey.includes("placeholder")
    ) {
      return new GeminiExtractionProvider(geminiKey);
    }

    // Default development & high-performance offline fallback
    return new NlpFallbackExtractionProvider();
  }
}
