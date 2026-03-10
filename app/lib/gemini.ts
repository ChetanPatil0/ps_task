import { GoogleGenerativeAI } from "@google/generative-ai"


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")


export async function createEmbedding(text: string) {
  try {
  const model = genAI.getGenerativeModel({
 model: "gemini-embedding-001",
})

    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (err: any) {
    console.error("[Gemini Embedding Error]", err)
    throw new Error("Failed to generate embedding: " + err.message)
  }
}
