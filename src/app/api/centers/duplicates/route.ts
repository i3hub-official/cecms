// src/app/api/centers/duplicates/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/server/db/index";
import { centers, admins, adminSessions } from "@/lib/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { jwtVerify } from "jose";

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

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
  "basic",
  "nursery",
  "junior",
  "senior",
  "university",
  "polytechnic",
  "education",
  "center",
  "centre",
];

// Helper function to verify auth token (same as /api/auth/user)
async function verifyAuthToken(request: NextRequest) {
  try {
    // Method 1: Check cookies from request
    const tokenFromCookie = request.cookies.get("auth-token")?.value;
    
    if (!tokenFromCookie) {
      // Also check Authorization header as fallback
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        return await verifyToken(token);
      }
      return null;
    }

    return await verifyToken(tokenFromCookie);
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

async function verifyToken(token: string) {
  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check session in database
    const session = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          eq(adminSessions.isActive, true),
          eq(adminSessions.adminId, payload.userId as string)
        )
      )
      .limit(1);

    if (session.length === 0) {
      console.log("No active session found in database");
      return null;
    }

    // Get user details
    const [user] = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isEmailVerified: admins.isEmailVerified,
        isActive: admins.isActive,
      })
      .from(admins)
      .where(eq(admins.id, payload.userId as string))
      .limit(1);

    if (!user || !user.isActive) {
      console.log("User not found or inactive");
      return null;
    }

    // Update session last used time
    await db
      .update(adminSessions)
      .set({ lastUsed: new Date() })
      .where(eq(adminSessions.id, session[0].id));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

function cleanName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && word.length > 2 && !COMMON_WORDS.includes(word))
    .join(" ")
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
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

function normalizeAddress(address: string): string {
  if (!address) return "";
  
  return address
    .toLowerCase()
    .replace(/\b(st\.?|street|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    
    if (!user) {
      console.log("Duplicates API: Unauthorized access attempt");
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized",
          message: "Please log in to access duplicate detection"
        }, 
        { status: 401 }
      );
    }

    // Check if user has permission (admin or superadmin only)
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { 
          success: false,
          error: "Forbidden",
          message: "You do not have permission to access duplicate detection"
        }, 
        { status: 403 }
      );
    }

    console.log(`Duplicates API: Authorized access for user ${user.email} (${user.role})`);

    // Get query parameters for filtering
    const url = new URL(request.url);
    const state = url.searchParams.get("state")?.trim();
    const lga = url.searchParams.get("lga")?.trim();
    const minSimilarity = parseInt(url.searchParams.get("minSimilarity") || "85");
    const maxResults = parseInt(url.searchParams.get("maxResults") || "50");

    console.log(`Finding duplicates with filters - State: ${state || 'all'}, LGA: ${lga || 'all'}, Min Similarity: ${minSimilarity}%`);

    // Fetch centers with optional filtering
    let centersQuery = db
      .select()
      .from(centers)
      .where(eq(centers.isActive, true));

    if (state) {
      // @ts-ignore - Type issue with ilike
      centersQuery = centersQuery.where(ilike(centers.state, `%${state}%`));
    }

    if (lga) {
      // @ts-ignore - Type issue with ilike
      centersQuery = centersQuery.where(ilike(centers.lga, `%${lga}%`));
    }

    const centersData = await centersQuery.orderBy(centers.createdAt);

    console.log(`Processing ${centersData.length} active centers for duplicates`);

    // Group centers by state and LGA
    const groups = new Map<string, typeof centersData>();
    for (const c of centersData) {
      const key = `${c.state.toLowerCase()}|${c.lga.toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    const duplicates: Array<{
      id: string;
      centers: Array<{
        id: string;
        number: string;
        name: string;
        address: string;
        state: string;
        lga: string;
        isActive: boolean;
        createdAt: Date;
        modifiedAt: Date | null;
      }>;
      similarity: number;
      type: "name" | "address" | "both";
      reason: string;
      confidence: "high" | "medium" | "low";
    }> = [];

    let duplicateGroupId = 1;

    // Process each geographical group
    for (const [locationKey, groupCenters] of groups) {
      if (groupCenters.length < 2) continue;

      // First pass: Check for exact name matches after cleaning
      const nameMap = new Map<string, typeof groupCenters>();
      for (const center of groupCenters) {
        const cleanedName = cleanName(center.name);
        if (!cleanedName) continue;
        
        if (!nameMap.has(cleanedName)) {
          nameMap.set(cleanedName, []);
        }
        nameMap.get(cleanedName)!.push(center);
      }

      // Add exact name matches
      for (const [, matchingCenters] of nameMap) {
        if (matchingCenters.length > 1) {
          duplicates.push({
            id: `duplicate-group-${duplicateGroupId++}`,
            centers: matchingCenters,
            similarity: 100,
            type: "name",
            reason: "Exact name match after removing common words",
            confidence: "high",
          });
        }
      }

      // Second pass: Fuzzy matching for similar names and addresses
      const processed = new Set<string>();
      
      for (let i = 0; i < groupCenters.length; i++) {
        const current = groupCenters[i];
        if (processed.has(current.id)) continue;

        const similarCenters = [current];
        const cleanCurrentName = cleanName(current.name);
        const cleanCurrentAddress = normalizeAddress(current.address);

        for (let j = i + 1; j < groupCenters.length; j++) {
          const compare = groupCenters[j];
          if (processed.has(compare.id)) continue;

          const cleanCompareName = cleanName(compare.name);
          const cleanCompareAddress = normalizeAddress(compare.address);

          // Calculate similarities
          const nameSimilarity = calculateSimilarity(cleanCurrentName, cleanCompareName);
          const addressSimilarity = calculateSimilarity(cleanCurrentAddress, cleanCompareAddress);

          // Check if we have a potential duplicate
          const isDuplicate = 
            (cleanCurrentName && cleanCompareName && nameSimilarity >= minSimilarity) ||
            (cleanCurrentAddress && cleanCompareAddress && addressSimilarity >= minSimilarity);

          if (isDuplicate) {
            similarCenters.push(compare);
            processed.add(compare.id);
          }
        }

        // If we found similar centers, add them to duplicates
        if (similarCenters.length > 1) {
          // Calculate overall similarity
          const nameSimilarities: number[] = [];
          const addressSimilarities: number[] = [];
          
          for (let k = 0; k < similarCenters.length; k++) {
            for (let l = k + 1; l < similarCenters.length; l++) {
              const nameSim = calculateSimilarity(
                cleanName(similarCenters[k].name),
                cleanName(similarCenters[l].name)
              );
              const addrSim = calculateSimilarity(
                normalizeAddress(similarCenters[k].address),
                normalizeAddress(similarCenters[l].address)
              );
              
              if (nameSim > 0) nameSimilarities.push(nameSim);
              if (addrSim > 0) addressSimilarities.push(addrSim);
            }
          }

          const avgNameSimilarity = nameSimilarities.length > 0 
            ? nameSimilarities.reduce((a, b) => a + b, 0) / nameSimilarities.length 
            : 0;
          const avgAddressSimilarity = addressSimilarities.length > 0 
            ? addressSimilarities.reduce((a, b) => a + b, 0) / addressSimilarities.length 
            : 0;

          const maxSimilarity = Math.max(avgNameSimilarity, avgAddressSimilarity);
          const duplicateType = avgNameSimilarity > avgAddressSimilarity ? "name" : 
                               avgAddressSimilarity > avgNameSimilarity ? "address" : "both";
          
          let confidence: "high" | "medium" | "low" = "medium";
          if (maxSimilarity >= 95) confidence = "high";
          else if (maxSimilarity >= 85) confidence = "medium";
          else confidence = "low";

          let reason = "";
          if (duplicateType === "name") {
            reason = `Similar names (${Math.round(avgNameSimilarity)}% match)`;
          } else if (duplicateType === "address") {
            reason = `Similar addresses (${Math.round(avgAddressSimilarity)}% match)`;
          } else {
            reason = `Similar names (${Math.round(avgNameSimilarity)}%) and addresses (${Math.round(avgAddressSimilarity)}%)`;
          }

          duplicates.push({
            id: `duplicate-group-${duplicateGroupId++}`,
            centers: similarCenters,
            similarity: Math.round(maxSimilarity),
            type: duplicateType,
            reason,
            confidence,
          });

          similarCenters.forEach(c => processed.add(c.id));
        }
      }
    }

    // Sort duplicates by similarity (highest first) and limit results
    duplicates.sort((a, b) => b.similarity - a.similarity);
    const limitedDuplicates = duplicates.slice(0, maxResults);

    console.log(`Found ${limitedDuplicates.length} potential duplicate groups`);

    return NextResponse.json({
      success: true,
      data: {
        duplicates: limitedDuplicates,
        summary: {
          totalGroups: limitedDuplicates.length,
          totalCenters: limitedDuplicates.reduce((sum, group) => sum + group.centers.length, 0),
          byType: {
            name: limitedDuplicates.filter(d => d.type === "name").length,
            address: limitedDuplicates.filter(d => d.type === "address").length,
            both: limitedDuplicates.filter(d => d.type === "both").length,
          },
          byConfidence: {
            high: limitedDuplicates.filter(d => d.confidence === "high").length,
            medium: limitedDuplicates.filter(d => d.confidence === "medium").length,
            low: limitedDuplicates.filter(d => d.confidence === "low").length,
          },
        },
        filters: {
          state: state || "all",
          lga: lga || "all",
          minSimilarity,
          maxResults,
        },
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error finding duplicates:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to find duplicates",
        message: "An internal server error occurred while detecting duplicates",
        details: process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.message 
          : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    }
  );
}

// Helper function for case-insensitive search (type-safe version)
function ilike(column: any, value: string) {
  return sql`${column} ILIKE ${value}`;
}