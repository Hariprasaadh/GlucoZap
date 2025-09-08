import { NextRequest, NextResponse } from 'next/server';
import { getPatientData } from '@/lib/patient-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const patients = await getPatientData(limit);
    
    return NextResponse.json({
      success: true,
      data: patients,
      total: patients.length
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patient data' },
      { status: 500 }
    );
  }
}
