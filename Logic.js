// Logic.js - Core helper functions using local WebLLM
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

const SELECTED_MODEL = "Llama-3.2-11B-Vision-Instruct-q4f16_1-MLC";

export async function initializeLocalModel(progressCallback) {
  if (engine) return engine;

  try {
    engine = await webllm.CreateMLCEngine(
      SELECTED_MODEL,
      { 
        initProgressCallback: (progress) => {
          if (progressCallback) progressCallback(progress.text);
        } 
      }
    );
    return engine;
  } catch (error) {
    console.error("Failed to load local AI model:", error);
    throw error;
  }
}

export async function processChartWithAI(imageBase64, priority = "executive") {
  if (!engine) {
    throw new Error("Local AI model is not initialized yet.");
  }

  const systemPrompts = {
    executive:
      "You are an expert data analyst. Look at the provided chart or graph and write a clear, concise executive summary highlighting the main takeaways.",
    trends:
      "You are an expert data analyst. Look at the provided chart or graph and focus intensely on key trends, growth patterns, and trajectories over time.",
    data:
      "You are an expert data analyst. Look at the provided chart or graph and extract specific data points, numerical values, axis metrics, and quantitative details.",
    anomalies:
      "You are an expert data analyst. Look at the provided chart or graph and focus specifically on anomalies, outliers, unexpected spikes, or drops.",
    correlation:
      "You are an expert data analyst specializing in visual correlation analysis. Examine the chart to identify relationships, co-movement, or correlations between variables or series. Specify: (1) which variables/series are compared, (2) the direction and pattern (positive, negative, non-linear, lagged, weak/none, or clustered), (3) any outliers or regimes where the relationship breaks down, and (4) visual caveats (such as dual/truncated axes, shared time trends, or that correlation does not prove causation). Be honest when a single-series chart lacks a second variable to correlate against."
  };

  const systemContent = systemPrompts[priority] || systemPrompts.executive;

  try {
    const messages = [
      {
        role: "system",
        content: systemContent
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              priority === "correlation"
                ? "Analyze this chart for correlations and relationships between variables/series:"
                : "Please analyze this chart according to the specified focus:"
          },
          {
            type: "image_url",
            image_url: { url: imageBase64 }
          }
        ]
      }
    ];

    const reply = await engine.chat.completions.create({
      messages,
      temperature: 0.25,
      max_tokens: 450,
    });

    return reply.choices[0].message.content;
  } catch (error) {
    console.error("Local AI Processing Error:", error);
    throw error;
  }
}
