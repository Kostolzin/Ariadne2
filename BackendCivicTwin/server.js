// server.js
// Main backend entry point.
// It wires together:
// - AI decision endpoint
// - backend event routes
// - middleware/services

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Type } from "@google/genai";

import { workflows } from "./workflows.js";
import { createAIClient } from "./aiClient.js";
import { buildCivicPrompt } from "./promptBuilder.js";
import { enrichCommandWithGovernmentData } from "./commandBuilder.js";
import { handleAIError } from "./fallbackHandler.js";
import { mapsToolDeclarations, executeMapsTool } from "./mapsTools.js";

// Import backend event routes.
import { eventRouter } from "./eventRoutes.js";
import { mapsRouter } from "./mapsRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = createAIClient(process.env.GEMINI_API_KEY);

async function generateContentWithRetry(request, retries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      lastError = error;

      console.error(`Gemini attempt ${attempt} failed:`, error.message);

      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
      }
    }
  }

  throw lastError;
}

const civicResponseSchema = {
  type: Type.OBJECT,

  properties: {
    assistantMessage: { type: Type.STRING },
    workflow: { type: Type.STRING },
    workflowVariant: { type: Type.STRING },
    clarificationNeeded: { type: Type.BOOLEAN },
    clarificationQuestion: { type: Type.STRING },
    highlightBuilding: { type: Type.STRING },
    openPanel: { type: Type.STRING },
    nextAction: { type: Type.STRING },
    acceptPendingAction: { type: Type.BOOLEAN },
    pendingActionDecision: { type: Type.STRING },

    relatedWorkflows: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },

  required: [
    "assistantMessage",
    "workflow",
    "workflowVariant",
    "clarificationNeeded",
    "clarificationQuestion",
    "highlightBuilding",
    "openPanel",
    "nextAction",
    "relatedWorkflows",
    "acceptPendingAction",
    "pendingActionDecision",
  ],
};

const MAX_TOOL_ITERATIONS = 4;

/// <summary>
/// AI interpretation endpoint.
///
/// Unity sends natural language here.
/// AI interprets the civic intent — calling map tools when needed —
/// and returns a structured Unity command (workflow, panel, etc.)
/// plus an optional mapResult.
/// </summary>
app.post("/ai/decide", async (req, res) => {
  try {
    // conversationState allows follow-up clarification handling.
    const { message, user, conversationState, userLocation } = req.body;

    console.log("User message:", message);

    // Attach the browser-supplied GPS (if any) so the maps tool can pick it
    // up via `user.location` without changing the function-call signature.
    const userContext = userLocation
      ? { ...user, location: userLocation }
      : user;

    const prompt = buildCivicPrompt(
      message,
      user,
      workflows,
      conversationState
    );

    // Conversation history we feed back to Gemini on each turn so it
    // can see prior function calls and their results.
    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    // Latest successful map result, returned to Unity alongside the
    // structured command so the client can drop a marker / open the map.
    let lastMapResult = null;

    // Phase 1: tools loop.
    //
    // Gemini rejects `tools` combined with `responseMimeType:
    // application/json`, so this phase runs WITHOUT the schema. We loop
    // while the model keeps requesting function calls.
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const response = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents,
        config: {
          tools: [{ functionDeclarations: mapsToolDeclarations }],
        },
      });

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) break;
      console.log("Tool calls:", calls.map((c) => c.name).join(", "));

      // Append the model's function-call turn.
      contents.push({
        role: "model",
        parts: calls.map((c) => ({
          functionCall: { name: c.name, args: c.args ?? {} },
        })),
      });

      // Execute each tool and append the responses for the next turn.
      const responseParts = [];
      for (const call of calls) {
        const toolResult = await executeMapsTool(call, userContext);
        if (toolResult?.error) {
          console.warn(`Tool ${call.name} returned error:`, toolResult.error);
        }

        if (call.name === "findNearestOffice" && toolResult && !toolResult.error) {
          lastMapResult = toolResult;
        }

        responseParts.push({
          functionResponse: {
            name: call.name,
            response: toolResult ?? { error: "No result" },
          },
        });
      }

      contents.push({ role: "user", parts: responseParts });
    }

    // Phase 2: structured-output call.
    //
    // Tools are removed; the schema is enforced. The model now has all
    // tool results in `contents` and emits the final Unity command.
    const finalResponse = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: civicResponseSchema,
      },
    });

    let result = JSON.parse(finalResponse.text);

    if (lastMapResult) {
      result.mapResult = lastMapResult;
    }

    // Add mock government API data.
    result = enrichCommandWithGovernmentData(result, user);

    console.log(result);
    return res.json(result);
  } catch (error) {
    handleAIError(error, res);
  }
});

/// <summary>
/// Mount backend event routes.
/// 
/// Example:
/// POST /api/event
/// </summary>
app.use("/api/event", eventRouter);
app.use("/api/maps", mapsRouter);

app.listen(3000, () => {
  console.log("Gemini backend running at http://localhost:3000");
});