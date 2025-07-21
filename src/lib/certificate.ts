export interface CertificateData {
  studentName: string;
  competitionName: string;
  competitionEvent?: string;
  competitionId: string;
  startDate: string;
  endDate: string;
  organizationName: string;
  organizerName?: string;
  organizerPosition?: string;
  orgLogoURL?: string;
  studentId: string;
  isTeamEvent?: boolean;
  teamName?: string;
  teamMembers?: Array<{
    name: string;
    email: string;
    institute?: string;
    contact?: string;
    qualification?: string;
    resume?: string;
  }>;
}

export const generateCertificate = async (data: CertificateData) => {
  try {
    console.log('Sending certificate data:', data);
    
    const response = await fetch('/api/certificates/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Certificate generation result:', result);
    
    return result;
  } catch (error) {
    console.error('Certificate generation failed:', error);
    throw error;
  }
};

export const checkCertificateExists = async (studentId: string, competitionId: string) => {
  try {
    const response = await fetch(`/api/certificates/check?studentId=${studentId}&competitionId=${competitionId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to check certificate');
    }

    return result;
  } catch (error) {
    console.error('Certificate check failed:', error);
    throw error;
  }
}; 