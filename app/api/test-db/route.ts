
import { NextResponse } from "next/server"
import { db } from "../../lib/db"

export async function GET() {
  try {
    const [rows] = await db.query("SELECT 1 AS result")
    return NextResponse.json({ message: "MySQL connected!", rows })
  } catch (err) {
    return NextResponse.json({ message: "MySQL connection failed", error: err })
  }
}