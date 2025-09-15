// app/api/centers/duplicates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple similarity function for strings
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(
    longer.toLowerCase(),
    shorter.toLowerCase()
  );
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  // Explicitly type the matrix as a 2D number array
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const duplicates: {
      centers: typeof centers;
      similarity: number;
      type: string;
    }[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < centers.length; i++) {
      if (processed.has(centers[i].id)) continue;

      const currentCenter = centers[i];
      const similarCenters = [currentCenter];

      for (let j = i + 1; j < centers.length; j++) {
        if (processed.has(centers[j].id)) continue;

        const compareCenter = centers[j];

        // Check name similarity
        const nameSimilarity = calculateSimilarity(
          currentCenter.name,
          compareCenter.name
        );

        // Check address similarity
        const addressSimilarity = calculateSimilarity(
          currentCenter.address,
          compareCenter.address
        );

        // Check location match
        const locationMatch =
          currentCenter.state === compareCenter.state &&
          currentCenter.lga === compareCenter.lga;

        if (
          nameSimilarity >= 80 ||
          (addressSimilarity >= 85 && locationMatch)
        ) {
          similarCenters.push(compareCenter);
          processed.add(compareCenter.id);
        }
      }

      if (similarCenters.length > 1) {
        const maxSimilarity = Math.max(
          calculateSimilarity(similarCenters[0].name, similarCenters[1].name),
          calculateSimilarity(
            similarCenters[0].address,
            similarCenters[1].address
          )
        );

        duplicates.push({
          centers: similarCenters,
          similarity: Math.round(maxSimilarity),
          type:
            calculateSimilarity(
              similarCenters[0].name,
              similarCenters[1].name
            ) >
            calculateSimilarity(
              similarCenters[0].address,
              similarCenters[1].address
            )
              ? "name"
              : "address",
        });

        similarCenters.forEach((center) => processed.add(center.id));
      }
    }

    return NextResponse.json(duplicates);
  } catch (error) {
    console.error("Error finding duplicates:", error);
    return NextResponse.json(
      {
        message: "Failed to find duplicates",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
