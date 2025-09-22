// src/app/api/centers/duplicates/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers } from "@/lib/server/db/schema";
import { getUserFromCookies } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word && !COMMON_WORDS.includes(word))
    .join(" ");
}

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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const centersData = await db
      .select()
      .from(centers)
      .where(eq(centers.isActive, true))
      .orderBy(centers.createdAt);

    const groups = new Map<string, typeof centersData>();
    for (const c of centersData) {
      const key = `${c.state}|${c.lga}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    const duplicates: {
      centers: typeof centersData;
      similarity: number;
      type: "name" | "address";
    }[] = [];

    for (const [, groupCenters] of groups) {
      const buckets = new Map<string, typeof groupCenters>();
      for (const c of groupCenters) {
        const prefix = cleanName(c.name).split(/\s+/).slice(0, 2).join(" ");
        if (!buckets.has(prefix)) buckets.set(prefix, []);
        buckets.get(prefix)!.push(c);
      }

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
            const nameSimilarity = calculateSimilarity(cleanCurrentName, cleanCompareName);
            const addressSimilarity = calculateSimilarity(current.address, compare.address);

            if (nameSimilarity >= 90 || addressSimilarity >= 85) {
              similarCenters.push(compare);
              processed.add(compare.id);
            }
          }

          if (similarCenters.length > 1) {
            const maxSimilarity = Math.max(
              calculateSimilarity(cleanName(similarCenters[0].name), cleanName(similarCenters[1].name)),
              calculateSimilarity(similarCenters[0].address, similarCenters[1].address)
            );

            duplicates.push({
              centers: similarCenters,
              similarity: Math.round(maxSimilarity),
              type:
                calculateSimilarity(cleanName(similarCenters[0].name), cleanName(similarCenters[1].name)) >
                calculateSimilarity(similarCenters[0].address, similarCenters[1].address)
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
