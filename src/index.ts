import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";
import * as z from "zod";

const app = new Hono();

const welcomeStrings = [
  "Hello Hono!",
  "To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

const userMessage = z.object({
  message: z.string(),
});

app
  .get("/", (c) => {
    return c.text(welcomeStrings.join("\n\n"));
  })
  .post("/messages", async (c) => {
    const body = await c.req.json();
    const result = userMessage.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Invalid input" }, 400);
    }
    const message = result.data.message;

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      return c.json({ error: "No response from AI" }, 500);
    }

    const candidate = response.candidates[0];
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      return c.json({ error: "Invalid response format from AI" }, 500);
    }

    const aiMessage = candidate.content.parts[0].text;
    if (!aiMessage) {
      return c.json({ error: "Empty response from AI" }, 500);
    }

    return c.json({ aiMessage });
  });

export default app;
