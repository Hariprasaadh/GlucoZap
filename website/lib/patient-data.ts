export interface PatientData {
  patient_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  race: string;
  condition: string;
  comorbidities: string;
  height_cm: number;
  baseline_weight_kg: number;
  baseline_bmi: number;
  baseline_systolic_bp: number;
  baseline_diastolic_bp: number;
  baseline_hba1c: number;
  baseline_ldl: number;
  baseline_hdl: number;
  baseline_triglycerides: number;
  baseline_creatinine: number;
  smoking_status: string;
  alcohol_status: string;
  activity_level: string;
  primary_medication: string;
  socioeconomic_status: string;
  insurance_type: string;
  risk_score: number;
  deterioration_label: number;
  risk_category: string;
}

export async function getPatientData(limit: number = 100): Promise<PatientData[]> {
  try {
    // For demo purposes, return mock data that simulates real patient records
    const mockPatients: PatientData[] = [];
    
    // More realistic sample data arrays
    const firstNames = [
      'John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 
      'James', 'Ashley', 'William', 'Jessica', 'Richard', 'Amanda', 'Thomas', 
      'Michelle', 'Christopher', 'Melissa', 'Daniel', 'Deborah', 'Matthew', 
      'Dorothy', 'Anthony', 'Amy', 'Mark', 'Angela', 'Donald', 'Helen', 
      'Steven', 'Brenda', 'Paul', 'Emma', 'Andrew', 'Olivia', 'Joshua', 
      'Cynthia', 'Kenneth', 'Marie', 'Kevin', 'Janet', 'Brian', 'Catherine',
      'George', 'Frances', 'Timothy', 'Christine', 'Ronald', 'Samantha',
      'Jason', 'Debra', 'Edward', 'Rachel', 'Jeffrey', 'Carolyn', 'Ryan'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 
      'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
      'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
      'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'
    ];
    
    const conditions = [
      'Diabetes', 'Hypertension', 'Heart Failure', 'COPD', 'Obesity', 
      'Chronic Kidney Disease'
    ];
    
    const races = ['White', 'Black', 'Hispanic', 'Asian', 'Other'];
    const genders = ['M', 'F'];
    
    const comorbidityGroups = [
      'Hypertension|Diabetes',
      'Sleep Apnea|Obesity',
      'Coronary Artery Disease|Hypertension',
      'Anxiety|Depression',
      'Osteoarthritis|Chronic Pain',
      'Asthma|Allergies',
      'Hyperlipidemia|Hypertension',
      'Atrial Fibrillation|Heart Disease',
      'Hypothyroidism|Metabolic Disorder',
      'COPD|Respiratory Disease'
    ];
    
    const medications = [
      'Metformin', 'Lisinopril', 'Atorvastatin', 'Amlodipine', 'Losartan',
      'Furosemide', 'Carvedilol', 'Insulin', 'Glipizide', 'Enalapril',
      'Digoxin', 'Albuterol', 'Prednisone', 'Warfarin', 'Aspirin'
    ];
    
    // Generate realistic patient data
    for (let i = 1; i <= limit; i++) {
      const id = `P${String(i + 3500).padStart(5, '0')}`;
      
      // Create more realistic risk score distribution
      const rand = Math.random();
      let riskScore;
      let riskCategory;
      
      if (rand < 0.4) { // 40% Very Low
        riskScore = Math.random() * 0.1;
        riskCategory = 'Very Low';
      } else if (rand < 0.65) { // 25% Low
        riskScore = 0.1 + Math.random() * 0.2;
        riskCategory = 'Low';
      } else if (rand < 0.80) { // 15% Moderate
        riskScore = 0.3 + Math.random() * 0.2;
        riskCategory = 'Moderate';
      } else if (rand < 0.92) { // 12% High
        riskScore = 0.5 + Math.random() * 0.3;
        riskCategory = 'High';
      } else { // 8% Very High
        riskScore = 0.8 + Math.random() * 0.2;
        riskCategory = 'Very High';
      }
      
      const age = 25 + Math.floor(Math.random() * 50);
      const height = 150 + Math.random() * 40;
      const weight = 50 + Math.random() * 70;
      const bmi = weight / ((height / 100) ** 2);
      
      mockPatients.push({
        patient_id: id,
        first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
        last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
        age: age,
        gender: genders[Math.floor(Math.random() * genders.length)],
        race: races[Math.floor(Math.random() * races.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        comorbidities: comorbidityGroups[Math.floor(Math.random() * comorbidityGroups.length)],
        height_cm: Math.round(height * 10) / 10,
        baseline_weight_kg: Math.round(weight * 10) / 10,
        baseline_bmi: Math.round(bmi * 10) / 10,
        baseline_systolic_bp: 110 + Math.floor(Math.random() * 50),
        baseline_diastolic_bp: 70 + Math.floor(Math.random() * 30),
        baseline_hba1c: Math.round((4.5 + Math.random() * 6) * 10) / 10,
        baseline_ldl: 70 + Math.floor(Math.random() * 100),
        baseline_hdl: 25 + Math.floor(Math.random() * 50),
        baseline_triglycerides: 80 + Math.floor(Math.random() * 200),
        baseline_creatinine: Math.round((0.5 + Math.random() * 3) * 100) / 100,
        smoking_status: ['Never', 'Former', 'Current'][Math.floor(Math.random() * 3)],
        alcohol_status: ['Never', 'Occasional', 'Regular'][Math.floor(Math.random() * 3)],
        activity_level: ['Sedentary', 'Light', 'Moderate', 'Active'][Math.floor(Math.random() * 4)],
        primary_medication: medications[Math.floor(Math.random() * medications.length)],
        socioeconomic_status: ['Low', 'Middle', 'High'][Math.floor(Math.random() * 3)],
        insurance_type: ['Private', 'Medicare', 'Medicaid', 'Uninsured'][Math.floor(Math.random() * 4)],
        risk_score: Math.round(riskScore * 1000) / 1000,
        deterioration_label: riskScore > 0.7 ? 1 : 0,
        risk_category: riskCategory
      });
    }
    
    return mockPatients;
  } catch (error) {
    console.error('Error generating patient data:', error);
    return [];
  }
}

export function getRiskScoreColor(riskScore: number): string {
  if (riskScore <= 0.1) return 'text-green-500';
  if (riskScore <= 0.3) return 'text-yellow-500';
  if (riskScore <= 0.7) return 'text-orange-500';
  return 'text-red-500';
}

export function getRiskScoreBadgeColor(riskCategory: string): string {
  switch (riskCategory) {
    case 'Very Low': return 'bg-green-100 text-green-800 border-green-200';
    case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Very High': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
