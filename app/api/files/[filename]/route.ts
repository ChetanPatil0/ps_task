import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

const uploadsDir = path.join(process.cwd(), "uploads")

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const pathname = url.pathname 
  const parts = pathname.split("/")
  const filename = parts[parts.length - 1]

  if (!filename) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 })
  }

  const filePath = path.join(uploadsDir, filename)

  try {
    const fileData = await fs.readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    let contentType = "application/octet-stream"
    if (ext === ".txt") contentType = "text/plain"
    else if (ext === ".pdf") contentType = "application/pdf"

    return new NextResponse(fileData, {
      status: 200,
      headers: { "Content-Type": contentType }
    })
  } catch (err) {
    console.error("[File GET Error]", err)
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}