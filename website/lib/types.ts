export interface ScreeningResult {
  id: string;
  userId: string;
  timestamp: Date;
  risk_level: 'low' | 'medium' | 'high';
  results: {
    skin?: any;
    face?: any;
    foot?: any;
    pose?: any;
    breathing?: any;
    questionnaire?: any;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  // Add more user profile fields as needed
}

// Add more types as needed
