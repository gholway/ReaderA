// Logic.js - Core helper functions using local WebLLM
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

// Choose a lightweight multimodal model that can run locally via WebGPU
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

export async function processChartWithAI(imageBase64) {
  if (!engine) {
    throw new Error("Local AI model is not initialized yet.");
  }

  try {
    const messages = [
      {
        role: "system",
        content: "You are an expert data analyst. Look at the provided chart or graph and write a clear, concise, and easy-to-understand plain-text summary of its key takeaways and trends."
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
            image_url: url = imageBase64
          }
        ]
      }
    ];

    const reply = await engine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 300,
    });

    return reply.choices[0].message.content;
  } catch (error) {
    console.error("Local AI Processing Error:", error);
    throw error;
  }
}
