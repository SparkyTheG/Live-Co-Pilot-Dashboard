/**
 * Test script to verify AI analysis pipeline
 * Run with: node test-analysis.js
 */

import dotenv from 'dotenv';
import { analyzeConversation } from './analysis/engine.js';

dotenv.config();

async function testAnalysis() {
  console.log('🧪 Testing AI Analysis Pipeline\n');
  
  const testTranscript = `I am 3 months behind on my mortgage payments. The auction is in 2 weeks and I am terrified of losing my home. My family needs help. I want to save my credit and protect my family from this disaster. I can't sleep at night thinking about what will happen. I know I've made mistakes but I need to fix this now.`;
  
  console.log('📝 Test Transcript:');
  console.log(testTranscript);
  console.log('\n' + '='.repeat(60) + '\n');
  
  try {
    console.log('⏳ Running analysis...\n');
    const result = await analyzeConversation(testTranscript, 'foreclosure');
    
    console.log('✅ Analysis Complete!\n');
    console.log('📊 Results Summary:');
    console.log('-'.repeat(60));
    
    console.log(`\n🏠 Prospect Type: ${result.prospectType}`);
    
    console.log(`\n📈 Lubometer:`);
    console.log(`  Score: ${result.lubometer?.score}`);
    console.log(`  Level: ${result.lubometer?.level}`);
    console.log(`  Interpretation: ${result.lubometer?.interpretation}`);
    
    console.log(`\n🛡️ Truth Index:`);
    console.log(`  Score: ${result.truthIndex?.score}`);
    console.log(`  Signals: ${result.truthIndex?.signals?.length || 0} detected`);
    console.log(`  Penalties: ${result.truthIndex?.penalties?.length || 0} applied`);
    
    console.log(`\n🔥 Hot Buttons: ${result.hotButtons?.length || 0} detected`);
    if (result.hotButtons && result.hotButtons.length > 0) {
      result.hotButtons.slice(0, 5).forEach(hb => {
        console.log(`  #${hb.id}: ${hb.name} (Score: ${hb.score?.toFixed(1)})`);
      });
    }
    
    console.log(`\n🚫 Objections: ${result.objections?.length || 0} detected`);
    if (result.objections && result.objections.length > 0) {
      result.objections.forEach(obj => {
        console.log(`  - ${obj.objectionText} (Probability: ${(obj.probability * 100).toFixed(0)}%)`);
      });
    }
    
    console.log(`\n❓ Diagnostic Questions: ${result.diagnosticQuestions?.asked?.length || 0} detected as asked`);
    console.log(`  Asked indices: [${result.diagnosticQuestions?.asked?.join(', ') || 'none'}]`);
    
    console.log(`\n🤖 AI Insights:`);
    if (result.aiInsights) {
      if (result.aiInsights.error) {
        console.log(`  ⚠️ Error: ${result.aiInsights.error}`);
      } else {
        console.log(`  ✅ AI analysis received`);
        console.log(`  Keys: ${Object.keys(result.aiInsights).join(', ')}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run test
testAnalysis();

