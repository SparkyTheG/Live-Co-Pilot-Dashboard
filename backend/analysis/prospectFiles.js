import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Maps prospect types to their corresponding txt files
 */
const PROSPECT_FILE_MAP = {
  'foreclosure': 'foreclosure-prospect.txt',
  'performing-tired-landlord': 'tired-landlord-prospect.txt',
  'distressed-landlord': 'distressed-landlord-prospect.txt',
  'cash-equity-seller': 'cash-equity-seller.txt',
  'creative-seller-financing': 'creative-finance-savvy-prospect.txt'
};

/**
 * Cache for loaded prospect files
 */
const prospectFileCache = new Map();

/**
 * Loads the prospect-specific txt file content
 */
export function loadProspectFile(prospectType) {
  // Check cache first
  if (prospectFileCache.has(prospectType)) {
    return prospectFileCache.get(prospectType);
  }

  const fileName = PROSPECT_FILE_MAP[prospectType];
  if (!fileName) {
    console.warn(`No file mapping found for prospect type: ${prospectType}`);
    return null;
  }

  try {
    // Path to txt files folder (one level up from backend/analysis)
    const txtFilesPath = path.join(__dirname, '../txt files', fileName);
    const content = fs.readFileSync(txtFilesPath, 'utf-8');
    
    // Cache the content
    prospectFileCache.set(prospectType, content);
    return content;
  } catch (error) {
    console.error(`Error loading prospect file for ${prospectType}:`, error);
    return null;
  }
}

/**
 * Gets the prospect file mapping for documentation
 */
export function getProspectFileMapping() {
  return PROSPECT_FILE_MAP;
}

