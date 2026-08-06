// app/api/find-jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming form data
    const formData = await request.formData();
    const resumeFile = formData.get('resume_file');

    if (!resumeFile) {
      return NextResponse.json({ detail: 'No resume file found.' }, { status: 400 });
    }
    
    // 2. Load Environment Variables
    const backendUrl = process.env.PYTHON_API_URL;     // https://mourad675-goose-job-ai.hf.space
    const internalKey = process.env.INTERNAL_API_KEY;  // Goose_Super_Secret...
    const hfToken = process.env.HF_ACCESS_TOKEN;       // hf_... (Read token)

    // Check if configuration exists
    if (!backendUrl || !internalKey || !hfToken) {
      console.error("Missing Environment Variables: Check .env.local");
      return NextResponse.json({ detail: 'Server configuration error.' }, { status: 500 });
    }

    // 3. Construct the full backend endpoint
    // Handles cases where the URL might or might not have a trailing slash
    const endpoint = backendUrl.endsWith('/') 
      ? `${backendUrl}find-jobs/` 
      : `${backendUrl}/find-jobs/`;

    // 4. Forward the request to Hugging Face
    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        // HEADER 1: Opens the Private Space Gate (Hugging Face Auth)
        'Authorization': `Bearer ${hfToken}`,

        // HEADER 2: Unlocks your Python API (Your Custom Security)
        'X-Internal-Key': internalKey,
        
        // Note: Do NOT set 'Content-Type'. Fetch sets the multipart boundary automatically.
      },
      body: formData,
    });

    // 5. Return the response to the Frontend
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error("Backend Error:", data);
      return NextResponse.json(data, { status: backendResponse.status });
    }
    
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}