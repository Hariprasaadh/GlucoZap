import jsPDF from 'jspdf';

interface TestResult {
  id: string;
  name: string;
  type: 'diabetes' | 'retinopathy' | 'stress' | 'bmi' | 'acanthosis';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  score?: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  result: string;
  recommendations: string[];
  details: {
    [key: string]: string | number | boolean | string[];
  };
}

interface ReportData {
  id: string;
  patientName: string;
  generatedDate: string;
  overallRiskScore: number;
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'severe';
  testResults: TestResult[];
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
}

export const generateHealthReportPDF = (reportData: ReportData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number = 8): string[] => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxWidth);
  };

  // Helper function to draw a simple bar
  const drawBar = (x: number, y: number, width: number, height: number, percentage: number, color: [number, number, number]) => {
    // Background
    pdf.setFillColor(230, 230, 230);
    pdf.rect(x, y, width, height, 'F');
    // Fill
    const fillWidth = (width * percentage) / 100;
    pdf.setFillColor(...color);
    pdf.rect(x, y, fillWidth, height, 'F');
    // Border
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(x, y, width, height, 'S');
  };

  // Helper function to draw a circular gauge
  const drawCircularGauge = (x: number, y: number, radius: number, percentage: number, color: [number, number, number], label: string, score: number) => {
    // Background circle
    pdf.setFillColor(240, 240, 240);
    pdf.circle(x, y, radius, 'F');
    
    // Progress arc (simulated with filled circle for simplicity)
    const angle = (percentage / 100) * 360;
    pdf.setFillColor(...color);
    
    // Draw wedge (simplified - draw overlapping circles)
    if (percentage > 0) {
      // Inner circle with color
      pdf.circle(x, y, radius * 0.85, 'F');
      
      // White center
      pdf.setFillColor(255, 255, 255);
      pdf.circle(x, y, radius * 0.6, 'F');
    }
    
    // Score in center
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(score.toString(), x, y + 1, { align: 'center' });
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x, y + 6, { align: 'center' });
  };

  // Helper function to get risk color
  const getRiskColor = (level: string): [number, number, number] => {
    switch (level) {
      case 'low': return [16, 185, 129]; // Emerald
      case 'moderate': return [251, 191, 36]; // Amber
      case 'high': return [239, 68, 68]; // Red
      case 'severe': return [220, 38, 38]; // Dark Red
      default: return [156, 163, 175]; // Gray
    }
  };

  // === HEADER ===
  // Background gradient simulation with rectangles
  pdf.setFillColor(17, 24, 39); // Dark background
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // GlucoZap Logo/Title
  pdf.setTextColor(96, 165, 250); // Blue
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GlucoZap', margin, yPosition + 8);
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Health Assessment Report', margin, yPosition + 16);
  
  // Report ID - More visible with better positioning
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Report #${reportData.id}`, margin, yPosition + 24);
  
  // Patient Name - More visible with better positioning
  pdf.setFontSize(10);
  pdf.setTextColor(147, 197, 253); // Light blue
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Patient: ${reportData.patientName}`, margin, yPosition + 31);
  
  // Date on right side with better alignment
  pdf.setFontSize(9);
  pdf.setTextColor(209, 213, 219);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${new Date(reportData.generatedDate).toLocaleDateString()}`, pageWidth - margin - 40, yPosition + 31);
  
  yPosition = 45;

  // === OVERALL RISK SCORE WITH CIRCULAR GAUGE ===
  const riskColor = getRiskColor(reportData.overallRiskLevel);
  
  // Larger, centered circular gauge with better positioning
  const gaugeX = pageWidth - margin - 18;
  const gaugeY = yPosition + 8;
  const gaugeRadius = 10;
  
  // Outer ring
  pdf.setFillColor(240, 240, 240);
  pdf.circle(gaugeX, gaugeY, gaugeRadius, 'F');
  
  // Inner colored ring
  pdf.setFillColor(...riskColor);
  pdf.circle(gaugeX, gaugeY, gaugeRadius * 0.88, 'F');
  
  // White center
  pdf.setFillColor(255, 255, 255);
  pdf.circle(gaugeX, gaugeY, gaugeRadius * 0.6, 'F');
  
  // Score in center - larger and more visible
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(reportData.overallRiskScore.toString(), gaugeX, gaugeY + 2, { align: 'center' });
  
  // "OVERALL" label above gauge
  pdf.setFillColor(...riskColor);
  pdf.roundedRect(pageWidth - margin - 28, yPosition - 1, 20, 6, 1, 1, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OVERALL', pageWidth - margin - 18, yPosition + 3, { align: 'center' });
  
  // Risk level label below gauge
  pdf.setFontSize(7);
  pdf.setTextColor(...riskColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(reportData.overallRiskLevel.toUpperCase(), gaugeX, gaugeY + 8, { align: 'center' });
  
  yPosition += 20;

  // === HEALTH STATS DASHBOARD ===
  pdf.setFillColor(236, 72, 153); // Pink background
  pdf.roundedRect(margin, yPosition, contentWidth, 6, 1, 1, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Health Statistics Overview', margin + 2, yPosition + 4.5);
  
  yPosition += 9;
  
  // Create stats boxes with better spacing
  const statBoxWidth = (contentWidth - 9) / 4; // 3 gaps of 3mm between 4 boxes
  const stats = [
    { label: 'Tests Completed', value: reportData.testResults.length.toString(), icon: '✓', color: [59, 130, 246] as [number, number, number] },
    { label: 'High Risk Areas', value: reportData.testResults.filter(t => t.riskLevel === 'high' || t.riskLevel === 'severe').length.toString(), icon: '⚠', color: [239, 68, 68] as [number, number, number] },
    { label: 'Low Risk Areas', value: reportData.testResults.filter(t => t.riskLevel === 'low').length.toString(), icon: '✓', color: [34, 197, 94] as [number, number, number] },
    { label: 'Follow-ups', value: reportData.nextSteps.length.toString(), icon: '→', color: [139, 92, 246] as [number, number, number] }
  ];
  
  stats.forEach((stat, idx) => {
    const statX = margin + (idx * (statBoxWidth + 3));
    
    // Stat box with subtle shadow effect
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(statX, yPosition, statBoxWidth, 14, 1.5, 1.5, 'F');
    
    // Border
    pdf.setDrawColor(...stat.color);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(statX, yPosition, statBoxWidth, 14, 1.5, 1.5, 'S');
    pdf.setLineWidth(0.2); // Reset
    
    // Icon with colored circle background
    pdf.setFillColor(...stat.color);
    pdf.circle(statX + 4, yPosition + 5, 2, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.icon, statX + 4, yPosition + 6.5, { align: 'center' });
    
    // Value - larger and more prominent
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text(stat.value, statX + statBoxWidth - 3, yPosition + 7, { align: 'right' });
    
    // Label - better positioned
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text(stat.label, statX + 2, yPosition + 11.5);
  });
  
  yPosition += 17;

  // === TEST RESULTS WITH STATS AND MINI GRAPHS ===
  pdf.setFillColor(109, 40, 217); // Purple background
  pdf.roundedRect(margin, yPosition, contentWidth, 6, 1, 1, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Test Results Summary with Risk Analysis', margin + 2, yPosition + 4.5);
  
  yPosition += 9;

  // Display tests in a 2-column grid with mini bar charts
  const testBoxWidth = (contentWidth - 3) / 2; // 3mm gap
  const testBoxHeight = 24;
  let xPos = margin;
  let colCount = 0;

  reportData.testResults.slice(0, 4).forEach((test, idx) => {
    // Test card background with subtle shadow
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(xPos, yPosition, testBoxWidth, testBoxHeight, 1.5, 1.5, 'F');
    
    // Border based on risk
    const testRiskColor = getRiskColor(test.riskLevel);
    pdf.setDrawColor(...testRiskColor);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(xPos, yPosition, testBoxWidth, testBoxHeight, 1.5, 1.5, 'S');
    pdf.setLineWidth(0.2); // Reset
    
    // Test name - better positioning
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    const shortName = test.name.replace('Assessment', '').replace('Detection', '').replace('Analysis', '').replace('Screening', '').trim();
    pdf.text(shortName, xPos + 2.5, yPosition + 4.5);
    
    // Risk badge - better styling
    pdf.setFillColor(...testRiskColor);
    pdf.roundedRect(xPos + testBoxWidth - 20, yPosition + 2, 18, 5, 1, 1, 'F');
    
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(test.riskLevel.toUpperCase(), xPos + testBoxWidth - 11, yPosition + 5.5, { align: 'center' });
    
    // Score with better formatting
    if (test.score) {
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score: ${test.score}/100`, xPos + 2.5, yPosition + 9.5);
      
      // Mini bar chart with improved styling
      drawBar(xPos + 2.5, yPosition + 11, testBoxWidth - 5, 3.5, test.score, testRiskColor);
      
      // Add percentage text on bar
      pdf.setFontSize(6);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${test.score}%`, xPos + 2.5 + ((testBoxWidth - 5) * test.score / 100) - 3, yPosition + 13.5);
    }
    
    // Result (truncated) - better spacing
    pdf.setFontSize(6.5);
    pdf.setTextColor(55, 65, 81);
    const truncatedResult = test.result.length > 75 ? test.result.substring(0, 75) + '...' : test.result;
    const resultLines = wrapText(truncatedResult, testBoxWidth - 5, 6.5);
    resultLines.slice(0, 2).forEach((line, lineIdx) => {
      pdf.text(line, xPos + 2.5, yPosition + 17.5 + (lineIdx * 3));
    });
    
    colCount++;
    if (colCount % 2 === 0) {
      xPos = margin;
      yPosition += testBoxHeight + 2;
    } else {
      xPos += testBoxWidth + 3;
    }
  });
  
  if (colCount % 2 !== 0) {
    yPosition += testBoxHeight + 2;
  }
  
  yPosition += 2;

  // === THREE COLUMN SECTION: KEY FINDINGS | RECOMMENDATIONS | NEXT STEPS ===
  const col1Width = contentWidth * 0.33;
  const col2Width = contentWidth * 0.34;
  const col3Width = contentWidth * 0.30;
  const colGap = 1.5;
  
  // Column 1: Key Findings
  pdf.setFillColor(30, 58, 138); // Blue background
  pdf.roundedRect(margin, yPosition, col1Width, 6, 1, 1, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Findings', margin + 2, yPosition + 4.5);
  
  // Column 2: Recommendations
  pdf.setFillColor(5, 150, 105); // Green background
  pdf.roundedRect(margin + col1Width + colGap, yPosition, col2Width, 6, 1, 1, 'F');
  pdf.text('Recommendations', margin + col1Width + colGap + 2, yPosition + 4.5);
  
  // Column 3: Next Steps
  pdf.setFillColor(139, 92, 246); // Purple background
  pdf.roundedRect(margin + col1Width + col2Width + (2 * colGap), yPosition, col3Width, 6, 1, 1, 'F');
  pdf.text('Next Steps', margin + col1Width + col2Width + (2 * colGap) + 2, yPosition + 4.5);
  
  yPosition += 8;
  
  const startY = yPosition;
  
  // Column 1 Content: Key Findings
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  let col1Y = startY;
  
  reportData.keyFindings.slice(0, 3).forEach((finding, index) => {
    // Blue bullet point
    pdf.setFillColor(59, 130, 246);
    pdf.circle(margin + 1.8, col1Y + 1.5, 0.7, 'F');
    
    const truncatedFinding = finding.length > 80 ? finding.substring(0, 80) + '...' : finding;
    const lines = wrapText(truncatedFinding, col1Width - 5, 6.5);
    lines.slice(0, 2).forEach((line) => {
      pdf.text(line, margin + 4, col1Y + 2);
      col1Y += 2.8;
    });
    col1Y += 1.2;
  });

  // Column 2 Content: Recommendations
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  let col2Y = startY;
  
  reportData.recommendations.slice(0, 3).forEach((rec, index) => {
    // Green checkmark circle
    pdf.setFillColor(16, 185, 129);
    pdf.circle(margin + col1Width + colGap + 1.8, col2Y + 1.5, 0.7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(5.5);
    pdf.text('✓', margin + col1Width + colGap + 1.2, col2Y + 2.2);
    
    pdf.setFontSize(6.5);
    pdf.setTextColor(55, 65, 81);
    const truncatedRec = rec.length > 80 ? rec.substring(0, 80) + '...' : rec;
    const lines = wrapText(truncatedRec, col2Width - 5, 6.5);
    lines.slice(0, 2).forEach((line) => {
      pdf.text(line, margin + col1Width + colGap + 4, col2Y + 2);
      col2Y += 2.8;
    });
    col2Y += 1.2;
  });
  
  // Column 3 Content: Next Steps
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81);
  let col3Y = startY;
  
  reportData.nextSteps.slice(0, 3).forEach((step, index) => {
    // Purple numbered circle
    pdf.setFillColor(139, 92, 246);
    pdf.circle(margin + col1Width + col2Width + (2 * colGap) + 2, col3Y + 1.5, 0.9, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}`, margin + col1Width + col2Width + (2 * colGap) + 2, col3Y + 2.3, { align: 'center' });
    
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    const truncatedStep = step.length > 70 ? step.substring(0, 70) + '...' : step;
    const lines = wrapText(truncatedStep, col3Width - 6, 6.5);
    lines.slice(0, 2).forEach((line) => {
      pdf.text(line, margin + col1Width + col2Width + (2 * colGap) + 5, col3Y + 2);
      col3Y += 2.8;
    });
    col3Y += 1.2;
  });
  
  yPosition = Math.max(col1Y, col2Y, col3Y) + 2;

  // === FOOTER ===
  // Add a subtle separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
  
  pdf.setFontSize(6.5);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'italic');
  const footerText = 'This report is for informational purposes only. Consult your healthcare provider for medical advice.';
  pdf.text(footerText, pageWidth / 2, yPosition + 5, { align: 'center', maxWidth: contentWidth });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.text(`Generated by GlucoZap | ${new Date().toLocaleDateString()}`, 
    pageWidth / 2, yPosition + 9, { align: 'center' });

  // Save the PDF
  const fileName = `GlucoZap_Health_Report_${reportData.id}_${reportData.patientName.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
};
