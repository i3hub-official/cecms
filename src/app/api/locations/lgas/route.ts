// app/api/locations/lgas/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json(
        { message: "State parameter is required" },
        { status: 400 }
      );
    }

    // Fetch LGAs for the specific state
    const lgasResponse = await fetch(
      `https://apinigeria.vercel.app/api/v1/lga?state=${encodeURIComponent(
        state
      )}`
    );

    if (!lgasResponse.ok) {
      throw new Error("Failed to fetch LGAs from external API");
    }

    const lgasData = await lgasResponse.json();
    const lgas = lgasData.lgas || [];

    return NextResponse.json({ lgas });
  } catch (error) {
    console.error("Error fetching LGAs:", error);
    return NextResponse.json(
      { message: "Failed to fetch LGAs", error },
      { status: 500 }
    );
  }
}
