'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PatientData, getRiskScoreBadgeColor } from '@/lib/patient-data';
import PatientDetailModal from '@/components/dashboard/PatientDetailModal';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  Loader2,
  Eye,
  Sparkles
} from 'lucide-react';

interface PatientDashboardData {
  success: boolean;
  data: PatientData[];
  total: number;
}

export default function PatientDashboard() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('All');
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 20;

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, searchTerm, selectedRiskFilter]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100');
      const data: PatientDashboardData = await response.json();
      
      if (data.success) {
        setPatients(data.data);
        setFilteredPatients(data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient => 
        patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply risk category filter
    if (selectedRiskFilter !== 'All') {
      filtered = filtered.filter(patient => patient.risk_category === selectedRiskFilter);
    }

    setFilteredPatients(filtered);
  };

  const openPatientDetail = (patient: PatientData) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const closePatientDetail = () => {
    setSelectedPatient(null);
    setIsModalOpen(false);
  };

  const getRiskStats = () => {
    const stats = {
      'Very Low': 0,
      'Low': 0,
      'Moderate': 0,
      'High': 0,
      'Very High': 0
    };

    patients.forEach(patient => {
      if (stats.hasOwnProperty(patient.risk_category)) {
        stats[patient.risk_category as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const riskStats = getRiskStats();
  const totalPatients = patients.length;
  const highRiskPatients = riskStats['High'] + riskStats['Very High'];
  const averageRiskScore = patients.length > 0 
    ? (patients.reduce((sum, p) => sum + p.risk_score, 0) / patients.length * 100).toFixed(1)
    : '0';

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)`
        }} />
      </div>

      {/* Header Section */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-gray-800/50">
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                  <Users size={24} />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Patient Dashboard
                </h1>
              </div>
              <p className="text-gray-400 text-lg ml-14">Cohort risk analysis and patient management</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPatients}</div>
              <p className="text-xs text-gray-400">Active in cohort</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">High Risk Patients</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{highRiskPatients}</div>
              <p className="text-xs text-gray-400">Require immediate attention</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Average Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{averageRiskScore}%</div>
              <p className="text-xs text-gray-400">Across all patients</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Filtered Results</CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{filteredPatients.length}</div>
              <p className="text-xs text-gray-400">Matching criteria</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, ID, or condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((risk) => (
                  <Button
                    key={risk}
                    variant={selectedRiskFilter === risk ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRiskFilter(risk)}
                    className={selectedRiskFilter === risk 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }
                  >
                    {risk}
                    {risk !== 'All' && (
                      <span className="ml-1 text-xs">
                        ({riskStats[risk as keyof typeof riskStats] || 0})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Table */}
        <Card className="bg-black/40 backdrop-blur-lg border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Patient Cohort - Risk Assessment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Patient</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Age/Gender</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Condition</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Risk Score</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Risk Category</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((patient) => (
                    <tr key={patient.patient_id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-white">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-400">{patient.patient_id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {patient.age} / {patient.gender}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{patient.condition}</div>
                        <div className="text-xs text-gray-400">{patient.race}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-lg font-semibold text-white">
                          {(patient.risk_score * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${getRiskScoreBadgeColor(patient.risk_category)} border`}>
                          {patient.risk_category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          onClick={() => openPatientDetail(patient)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {currentPatients.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No patients found matching the selected criteria.
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-gray-400 text-sm">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPatients.length)} of {filteredPatients.length} patients
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className={currentPage === pageNumber 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
                          }
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={closePatientDetail}
      />
    </div>
  );
}
