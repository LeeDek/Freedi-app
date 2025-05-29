const PERSPECTIVE_API_URL =
  "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

export async function analyzeTextWithPerspective(
  text: string
): Promise<boolean> {
  const apiKey = import.meta.env.VITE_PERSPECTIVE_API_KEY;

  const body = {
    comment: { text },
    languages: ["en", "es", "de", "du", "ar"],
    requestedAttributes: { TOXICITY: {} },
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
    const score = data.attributeScores?.TOXICITY?.summaryScore?.value || 0;

    return score >= 0.75; // Customize the threshold
  } catch (err) {
    console.error("Perspective API error:", err);

    return false; // If it fails, assume not toxic
  }
}
