// app/api/locations/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch from the Nigerian API
    const statesResponse = await fetch('https://apinigeria.vercel.app/api/v1/states');
    
    if (!statesResponse.ok) {
      throw new Error('Failed to fetch states from external API');
    }
    
    const statesData = await statesResponse.json();
    const states = statesData.states || [];
    
    // For LGAs, we'll return the states and let the client fetch LGAs as needed
    // since the API requires state parameter for LGA fetching
    return NextResponse.json({
      states: states,
      lgas: {} // Empty object since LGAs need to be fetched per state
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch locations', error },
      { status: 500 }
    );
  }
}