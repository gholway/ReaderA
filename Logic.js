// Logic.js - Core helper functions for AI requests

async function processChartWithAI(imageBase64, config) {
  if (!config.api_key || config.api_key === "YOUR_OPENAI_API_KEY_HERE") {
    throw new Error("API key is not configured. Please update config.json.");
  }

  const payload = {
    model: config.model || "gpt-4o",
    temperature: config.temperature || 0.3,
    messages: [
      {
        role: "system",
        content: "You are an expert data analyst. Your task is to look at the provided chart or graph and write a clear, concise, and easy-to-understand plain-text summary of its key takeaways and trends."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please simplify and summarize this chart:"
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ],
    max_tokens: 300
  };

  try {
    const response = await fetch(config.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.api_key}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to communicate with AI API.");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Processing Error:", error);
    throw error;
  }
}
