# Prospect Type to TXT File Mapping

This document shows which TXT file the AI will use for analysis based on the dropdown selection in the Live Co-Pilot Dashboard.

## Mapping Table

| Dropdown Selection | Prospect Type Value | TXT File Used |
|-------------------|-------------------|---------------|
| **Foreclosure** | `foreclosure` | `foreclosure-prospect.txt` |
| **Creative Seller Finance** | `creative-seller-financing` | `creative-finance-savvy-prospect.txt` |
| **Distressed Landlord** | `distressed-landlord` | `distressed-landlord-prospect.txt` |
| **Tired Landlord** | `performing-tired-landlord` | `tired-landlord-prospect.txt` |
| **Cash Equity Seller** | `cash-equity-seller` | `cash-equity-seller.txt` |

## How It Works

1. When a user selects a prospect type from the dropdown, the system:
   - Stores the selected prospect type
   - Loads the corresponding TXT file from the `txt files/` folder
   - Uses that file's content as context for AI analysis

2. During conversation analysis:
   - The backend uses **GPT-4o-mini** to analyze the conversation
   - The AI receives:
     - The conversation transcript
     - The CSV framework context (7 Pillars, 27 Indicators, Lubometer formula, etc.)
     - The prospect-specific TXT file content
   - Analysis combines:
     - Structured CSV-based scoring (pattern matching, indicators, pillars)
     - AI insights informed by the prospect-specific context file

3. Real-time updates:
   - As the conversation progresses, transcripts are sent to the backend
   - The backend analyzes using both CSV logic AND the selected prospect's TXT file
   - Results are sent back to the frontend via WebSocket
   - The dashboard updates in real-time with:
     - Lubometer score
     - Truth Index
     - Hot Buttons
     - Objections
     - Pillar scores

## File Locations

All TXT files are located in: `/txt files/`

- `foreclosure-prospect.txt`
- `tired-landlord-prospect.txt`
- `distressed-landlord-prospect.txt`
- `cash-equity-seller.txt`
- `creative-finance-savvy-prospect.txt`

## Example

If the user selects **"Tired Landlord"** from the dropdown:
- System loads: `tired-landlord-prospect.txt`
- AI analysis includes context about:
  - Tired landlord pain points (tenant management fatigue, maintenance burden)
  - Tired landlord desires (exit rental business, convert to passive income)
  - Tired landlord discovery phases and qualification signals
  - Tired landlord-specific objection patterns

The AI will then analyze conversations with this context in mind, providing more relevant and accurate insights specific to tired landlords.

