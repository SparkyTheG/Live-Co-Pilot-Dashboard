/**
 * Detects prospect type from conversation transcript
 */

export function detectProspectType(transcript) {
  const lowerTranscript = transcript.toLowerCase();

  // Foreclosure indicators
  if (
    lowerTranscript.includes('foreclosure') ||
    lowerTranscript.includes('auction') ||
    lowerTranscript.includes('behind on mortgage') ||
    lowerTranscript.includes('default notice') ||
    lowerTranscript.includes('losing my home') ||
    lowerTranscript.includes('save my credit')
  ) {
    return 'foreclosure';
  }

  // Distressed Landlord indicators
  if (
    (lowerTranscript.includes('landlord') || lowerTranscript.includes('rental')) &&
    (lowerTranscript.includes('bleeding') ||
     lowerTranscript.includes('losing money') ||
     lowerTranscript.includes('costing me') ||
     lowerTranscript.includes('nightmare') ||
     lowerTranscript.includes('distressed') ||
     lowerTranscript.includes('bad tenant'))
  ) {
    return 'distressed-landlord';
  }

  // Performing/Tired Landlord indicators
  if (
    (lowerTranscript.includes('landlord') || lowerTranscript.includes('rental')) &&
    (lowerTranscript.includes('tired') ||
     lowerTranscript.includes('exhausted') ||
     lowerTranscript.includes('done') ||
     lowerTranscript.includes('retirement') ||
     lowerTranscript.includes('peace of mind') ||
     lowerTranscript.includes('weekends'))
  ) {
    return 'performing-tired-landlord';
  }

  // Cash/Equity Seller indicators
  if (
    lowerTranscript.includes('cash') ||
    lowerTranscript.includes('equity') ||
    (lowerTranscript.includes('seller') && 
     (lowerTranscript.includes('fast') ||
      lowerTranscript.includes('quick') ||
      lowerTranscript.includes('speed') ||
      lowerTranscript.includes('certainty') ||
      lowerTranscript.includes('next deal') ||
      lowerTranscript.includes('investment')))
  ) {
    return 'cash-equity-seller';
  }

  // Creative Seller Financing (default)
  // This includes sub-to, seller carry, probate, inherited, etc.
  if (
    lowerTranscript.includes('seller financing') ||
    lowerTranscript.includes('seller carry') ||
    lowerTranscript.includes('sub-to') ||
    lowerTranscript.includes('subject to') ||
    lowerTranscript.includes('probate') ||
    lowerTranscript.includes('inherited') ||
    lowerTranscript.includes('estate') ||
    lowerTranscript.includes('creative')
  ) {
    return 'creative-seller-financing';
  }

  // Default to creative-seller-financing if no clear match
  return 'creative-seller-financing';
}

