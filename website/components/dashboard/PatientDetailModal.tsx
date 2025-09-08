'use client';

import { PatientData } from '@/lib/patient-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Heart, 
  AlertTriangle,
  X,
  FileText,
  Target,
  Shield
} from 'lucide-react';

interface PatientDetailModalProps {
  patient: PatientData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientDetailModal({ patient, isOpen, onClose }: PatientDetailModalProps) {
  if (!isOpen || !patient) return null;

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Very Low': return 'text-green-500 bg-green-50 border-green-200';
      case 'Low': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Very High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendations = (patient: PatientData) => {
    const recommendations = [];
    
    if (patient.baseline_bmi > 30) {
      recommendations.push("Refer to nutritionist for weight management program");
      recommendations.push("Consider bariatric evaluation if BMI > 35");
    }
    if (patient.baseline_hba1c > 7) {
      recommendations.push("Intensify diabetes management - target HbA1c < 7%");
      recommendations.push("Schedule endocrinology consultation");
    }
    if (patient.baseline_systolic_bp > 140 || patient.baseline_diastolic_bp > 90) {
      recommendations.push("Optimize blood pressure management - target < 130/80");
      recommendations.push("Review antihypertensive medications");
    }
    if (patient.smoking_status === 'Current') {
      recommendations.push("Urgent smoking cessation counseling and support");
      recommendations.push("Consider nicotine replacement therapy");
    }
    if (patient.activity_level === 'Sedentary') {
      recommendations.push("Initiate structured exercise program");
      recommendations.push("Physical therapy evaluation for safe exercise plan");
    }
    if (patient.baseline_ldl > 100) {
      recommendations.push("Optimize lipid management - target LDL < 100 mg/dL");
    }
    if (patient.baseline_creatinine > 1.5) {
      recommendations.push("Monitor kidney function closely");
      recommendations.push("Consider nephrology referral");
    }
    if (patient.risk_category === 'Very High') {
      recommendations.push("Schedule immediate follow-up within 2 weeks");
      recommendations.push("Consider hospitalization if symptoms worsen");
    }
    
    return recommendations.length > 0 ? recommendations.slice(0, 6) : ["Continue current care plan with regular monitoring"];
  };

  const getTrendData = () => {
    // Generate mock trend data for the past 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentRisk = patient?.risk_score || 0;
    
    return months.map((month) => {
      // Simulate realistic trend - slight variations around current risk
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const trendRisk = Math.max(0, Math.min(1, currentRisk + variation));
      
      return {
        month,
        risk: Math.round(trendRisk * 100),
        hba1c: Math.round((patient?.baseline_hba1c || 6) + (Math.random() - 0.5) * 1 * 10) / 10,
        bmi: Math.round((patient?.baseline_bmi || 25) + (Math.random() - 0.5) * 2 * 10) / 10
      };
    });
  };

  const keyDrivers = [
    { 
      label: 'BMI', 
      value: patient.baseline_bmi.toFixed(1), 
      status: patient.baseline_bmi > 30 ? 'high' : patient.baseline_bmi > 25 ? 'moderate' : 'normal' 
    },
    { 
      label: 'HbA1c', 
      value: `${patient.baseline_hba1c}%`, 
      status: patient.baseline_hba1c > 7 ? 'high' : patient.baseline_hba1c > 6.5 ? 'moderate' : 'normal' 
    },
    { 
      label: 'Blood Pressure', 
      value: `${patient.baseline_systolic_bp}/${patient.baseline_diastolic_bp}`, 
      status: patient.baseline_systolic_bp > 140 || patient.baseline_diastolic_bp > 90 ? 'high' : 'normal' 
    },
    { 
      label: 'Activity Level', 
      value: patient.activity_level, 
      status: patient.activity_level === 'Sedentary' ? 'high' : patient.activity_level === 'Light' ? 'moderate' : 'normal' 
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-gray-600">Patient ID: {patient.patient_id}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Score Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {(patient.risk_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-600">Risk Score</div>
                </div>
                <Badge className={`text-sm font-medium border ${getRiskColor(patient.risk_category)}`}>
                  {patient.risk_category} Risk
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Patient Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{patient.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Race:</span>
                  <span className="font-medium">{patient.race}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Height:</span>
                  <span className="font-medium">{patient.height_cm} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{patient.baseline_weight_kg} kg</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  <span>Medical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primary Condition:</span>
                  <span className="font-medium">{patient.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Medication:</span>
                  <span className="font-medium">{patient.primary_medication}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance:</span>
                  <span className="font-medium">{patient.insurance_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking Status:</span>
                  <span className="font-medium">{patient.smoking_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activity Level:</span>
                  <span className="font-medium">{patient.activity_level}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>12-Month Risk Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{(patient.risk_score * 100).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Current Risk</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {patient.risk_score < 0.3 ? '↓' : patient.risk_score < 0.7 ? '→' : '↑'}
                    </div>
                    <div className="text-sm text-gray-600">Trend</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {patient.risk_score > 0.7 ? 'High' : patient.risk_score > 0.3 ? 'Med' : 'Low'}
                    </div>
                    <div className="text-sm text-gray-600">Priority</div>
                  </div>
                </div>
                
                {/* Simple trend visualization */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Risk progression (last 6 months)</span>
                    <span>Target: &lt;30%</span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        patient.risk_score > 0.7 ? 'bg-red-500' :
                        patient.risk_score > 0.5 ? 'bg-orange-500' :
                        patient.risk_score > 0.3 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(patient.risk_score * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Risk Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <span>Key Risk Drivers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {keyDrivers.map((driver, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{driver.value}</div>
                    <div className="text-sm text-gray-600">{driver.label}</div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                      driver.status === 'high' ? 'bg-red-100 text-red-700' :
                      driver.status === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {driver.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comorbidities */}
          {patient.comorbidities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Comorbidities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {patient.comorbidities.split('|').map((condition, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {condition.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Recommended Next Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getRecommendations(patient).map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
