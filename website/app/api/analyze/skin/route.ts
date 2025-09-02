import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const image = data.get('image');

    // TODO: Call FastAPI backend for skin analysis
    // This is a placeholder response
    return NextResponse.json({
      risk_level: "low",
      findings: [],
      recommendations: []
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to analyze skin image" },
      { status: 500 }
    );
  }
}
