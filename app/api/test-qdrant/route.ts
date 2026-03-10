
import { qdrant } from "../../lib/qdrant";
import { NextResponse } from "next/server";


const COLLECTION = "documents";

export async function GET() {
  try {
   
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION);

    if (!exists) {
      await qdrant.createCollection(COLLECTION, {
        vectors: {
          size: 3072,
          distance: "Cosine",
        },
        on_disk_payload: true,
      });
      return NextResponse.json({
        status: "created",
        message: `Collection "${COLLECTION}" was missing → created successfully`,
        details: { vector_size: 3072, distance: "Cosine" },
      });
    }

    const info = await qdrant.getCollection(COLLECTION);

    return NextResponse.json({
      status: "exists",
      collection: info,
      vector_params: info.config?.params?.vectors,
      points_count: info.points_count,
    });
  } catch (err: any) {
    console.error("[Qdrant Test Error]", err);
    return NextResponse.json(
      { error: err.message || "Qdrant operation failed", details: err?.response },
      { status: 500 }
    );
  }
}