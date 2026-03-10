

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";
import { createEmbedding } from "../../lib/gemini";
import { qdrant } from "../../lib/qdrant";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [], message: "Enter search text" });

  try {
   
    const [rows]: any = await db.execute(
      "SELECT id, title, content, file_url FROM documents WHERE title LIKE ?",
      [`%${query}%`]
    );

    if (rows.length > 0) {
      const results = rows.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        preview: doc.content.slice(0, 500) + (doc.content.length > 500 ? "..." : ""),
        chunk_text: doc.content,
        file_url: doc.file_url, 
        score: "1.0",
      }));

      return NextResponse.json({ results });
    }

  
    const vector = await createEmbedding(query);
    const searchResult: any = await qdrant.search("documents", {
      vector,
      limit: 12,
      with_payload: true,
    });

    const MIN_SCORE = 0.4;
    const chunkHits = searchResult
      .filter((hit: any) => (hit.score ?? 0) >= MIN_SCORE)
      .map((hit: any) => ({
        id: hit.id,
        score: hit.score?.toFixed(3) || "0",
        doc_id: hit.payload?.doc_id,
        title: hit.payload?.title || "No title",
        preview: hit.payload?.preview || (hit.payload?.chunk_text?.slice(0, 280) + "...") || "No preview",
        chunk_text: hit.payload?.chunk_text || "",
      }));

   
    const grouped = new Map<number, any>();
    for (const hit of chunkHits) {
      const docId = hit.doc_id;
      if (!grouped.has(docId) || Number(hit.score) > Number(grouped.get(docId).score)) {
        grouped.set(docId, hit);
      }
    }

    const resultsArray = Array.from(grouped.values());

 
    const resultsWithUrl = [];
    for (const res of resultsArray) {
      const [rows]: any = await db.execute(
        "SELECT file_url FROM documents WHERE id = ?",
        [res.doc_id]
      );
      const file_url = rows.length ? rows[0].file_url : null;
      resultsWithUrl.push({ ...res, file_url });
    }

    return NextResponse.json({
      results: resultsWithUrl,
      message: resultsWithUrl.length === 0 ? "No relevant sections found" : undefined,
    });

  } catch (err: any) {
    console.error("Search failed:", err);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}