// app/api/find-jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume_file');

    if (!resumeFile) {
      return NextResponse.json({ detail: 'No resume file found.' }, { status: 400 });
    }
    
    const backendUrl = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000/find-jobs/';
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }
    
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}