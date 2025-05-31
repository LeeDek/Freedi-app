const PERSPECTIVE_API_URL =
  "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

export interface ModerationResult {
  passed: boolean;
  reason?: string;
}

export async function analyzeTextWithPerspective(
  text: string
): Promise<ModerationResult> {
  const apiKey = import.meta.env.VITE_PERSPECTIVE_API_KEY;

  const body = {
    comment: { text },
    languages: ["en", "es", "de", "du", "ar"],
    requestedAttributes: {
      TOXICITY: {},
      SEVERE_TOXICITY: {},
      INSULT: {},
      PROFANITY: {},
      IDENTITY_ATTACK: {},
    },
  };

  try {
    const response = await fetch(`${PERSPECTIVE_API_URL}?key=${apiKey}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const threshold = 0.75;

    for (const key in data.attributeScores) {
      const score = data.attributeScores[key].summaryScore.value;
      if (score >= threshold) {
        return {
          passed: false,
          reason: key.replace(/_/g, " ").toLowerCase(),
        };
      }
    }

    return { passed: true };
  } catch (err) {
    console.error("Perspective API error:", err);

    return { passed: true }; // Allow submission if API fails, or change to false if you want strict fail
  }
}
