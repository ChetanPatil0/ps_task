import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "../../lib/db";
import { checkFileIsSafe, isPathSafe, checkContentIsSafe } from "../../lib/security";
import { createEmbedding } from "../../lib/gemini";
import { qdrant } from "../../lib/qdrant";
import { chunkText } from "../../lib/chunk";

const uploadsDir = path.join(process.cwd(), "uploads");

async function ensureUploadsDir() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log("Uploads directory ensured:", uploadsDir);
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
}

export async function POST(req: NextRequest) {
  await ensureUploadsDir();
  let tempFilePath = "";

  try {
    const form = await req.formData();
    const fileEntry = form.get("file");
    const rawTitle = (form.get("title") as string)?.trim() || "";

    if (!rawTitle) {
      console.warn("Upload failed: Title is missing");
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    try {
      checkContentIsSafe(rawTitle);
    } catch (err: any) {
      return NextResponse.json({ error: "Title contains unsafe content" }, { status: 400 });
    }

    const title = rawTitle;

    if (!fileEntry || !(fileEntry instanceof File)) {
      console.warn("Upload failed: File is missing or invalid");
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const file = fileEntry;
    const { ext } = checkFileIsSafe(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    let contentText = "";

    if (ext === ".txt") {
      contentText = buffer.toString("utf8");
      console.log("Text file read successfully");
    } else {
      console.log("Parsing PDF file...");
      const PDFParse = (await import("pdf-parse")) as any;
      const result = await PDFParse(buffer);
      contentText = result.text;
      console.log("PDF file parsed successfully");
    }

    checkContentIsSafe(contentText);
    console.log("Content safety check passed");

    tempFilePath = path.join(uploadsDir, `${crypto.randomUUID()}${ext}`);
    await fs.writeFile(tempFilePath, buffer);
    console.log("Temporary file written:", tempFilePath);

    const chunks = chunkText(contentText, 1800, 400);
    console.log(`Content split into ${chunks.length} chunks`);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [docResult]: any = await conn.execute(
        "INSERT INTO documents (title, content, file_url) VALUES (?, ?, ?)",
        [title, contentText, ""]
      );
      const docId = docResult.insertId;
      console.log("Document inserted with ID:", docId);

      const ids: string[] = [];
      const vectors: number[][] = [];
      const payloads: Record<string, any>[] = [];

      for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk);
        const id = crypto.randomUUID();
        ids.push(id);
        vectors.push(embedding);
        payloads.push({
          doc_id: docId,
          title,
          chunk_text: chunk,
          preview: chunk.slice(0, 280),
        });
      }
      console.log("Embeddings created for all chunks");

      await qdrant.upsert("documents", {
        wait: true,
        batch: { ids, vectors, payloads },
      });
      console.log("Data upserted to Qdrant");

      const finalFilename = `${crypto.randomUUID()}${ext}`;
      const finalFilePath = path.join(uploadsDir, finalFilename);
      isPathSafe(uploadsDir, finalFilePath);
      await fs.rename(tempFilePath, finalFilePath);
      console.log("Temporary file moved to final location:", finalFilePath);

      await conn.execute("UPDATE documents SET file_url = ? WHERE id = ?", [
        `/api/files/${finalFilename}`,
        docId,
      ]);
      await conn.commit();
      console.log("Database updated with file URL and transaction committed");

      return NextResponse.json({ success: true, message: "File uploaded successfully", id: docId });
    } catch (e: any) {
      await conn.rollback();
      console.error("Transaction rolled back due to error:", e);
      if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
      throw e;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error("Upload failed:", err);
    if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 400 });
  }
}