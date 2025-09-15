// app/api/centers/duplicates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Common words to ignore when comparing names
const COMMON_WORDS = [
  "secondary",
  "school",
  "model",
  "high",
  "academy",
  "college",
  "grammar",
  "technical",
  "international",
  "primary",
  "institution",
];

function cleanName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .split(/\s+/)
    .filter((word) => word && !COMMON_WORDS.includes(word))
    .join(" ");
}

// Simple Levenshtein similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
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

    // Group centers by location (state + lga)
    const groups = new Map<string, typeof centers>();
    for (const c of centers) {
      const key = `${c.state}|${c.lga}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    const duplicates: {
      centers: typeof centers;
      similarity: number;
      type: "name" | "address";
    }[] = [];

    // Process each group independently
    for (const [, groupCenters] of groups) {
      // Further bucket by first 2 words of cleaned name
      const buckets = new Map<string, typeof groupCenters>();
      for (const c of groupCenters) {
        const prefix = cleanName(c.name).split(/\s+/).slice(0, 2).join(" ");
        if (!buckets.has(prefix)) buckets.set(prefix, []);
        buckets.get(prefix)!.push(c);
      }

      // Now compare only inside buckets
      for (const [, bucket] of buckets) {
        if (bucket.length < 2) continue;

        const processed = new Set<string>();

        for (let i = 0; i < bucket.length; i++) {
          const current = bucket[i];
          if (processed.has(current.id)) continue;

          const similarCenters = [current];
          const cleanCurrentName = cleanName(current.name);

          for (let j = i + 1; j < bucket.length; j++) {
            const compare = bucket[j];
            if (processed.has(compare.id)) continue;

            const cleanCompareName = cleanName(compare.name);

            const nameSimilarity = calculateSimilarity(
              cleanCurrentName,
              cleanCompareName
            );
            const addressSimilarity = calculateSimilarity(
              current.address,
              compare.address
            );

            if (nameSimilarity >= 90 || addressSimilarity >= 85) {
              similarCenters.push(compare);
              processed.add(compare.id);
            }
          }

          if (similarCenters.length > 1) {
            const maxSimilarity = Math.max(
              calculateSimilarity(
                cleanName(similarCenters[0].name),
                cleanName(similarCenters[1].name)
              ),
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
                  cleanName(similarCenters[0].name),
                  cleanName(similarCenters[1].name)
                ) >
                calculateSimilarity(
                  similarCenters[0].address,
                  similarCenters[1].address
                )
                  ? "name"
                  : "address",
            });

            similarCenters.forEach((c) => processed.add(c.id));
          }
        }
      }
    }

    return NextResponse.json(duplicates);
  } catch (error) {
    console.error("Error finding duplicates:", error);
    return NextResponse.json(
      { message: "Failed to find duplicates", error },
      { status: 500 }
    );
  }
}
