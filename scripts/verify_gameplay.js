/**
 * Automated Verification Script for Bara Al-Salfa & Lammtna Platform
 * Tests:
 * 1. ScoreEngine calculations matching Section 31
 * 2. TurnEngine question graph fairness & scaling for 3 to 20 players
 * 3. RoleAssigner randomness & integrity
 * 4. VotingEngine vote resolution & tiebreaker detection
 * 5. Content database count & structure (>500 items)
 * 6. GuessEngine distractor generation (1 correct + 5 distractors)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ScoreEngine } from '../src/core/scoring/ScoreEngine.js';
import { TurnEngine } from '../src/games/barra-al-salfa/engine/TurnEngine.js';
import { RoleAssigner } from '../src/games/barra-al-salfa/engine/RoleAssigner.js';
import { VotingEngine } from '../src/games/barra-al-salfa/engine/VotingEngine.js';
import { GuessEngine } from '../src/games/barra-al-salfa/engine/GuessEngine.js';
import { ContentManager } from '../src/content/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '..', 'src', 'content');

// Load JSON content in Node test
const jsonFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'));
for (const file of jsonFiles) {
  const cat = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
  if (data?.items) {
    ContentManager.loadCategoryData(cat, data.items.filter(i => i.enabled !== false));
  }
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing Scoring Engine (Section 31) ---');
  const scoreEngine = new ScoreEngine();

  const players = [
    { id: 'p1', name: 'حسن', score: 0, isImposter: false, vote: 'p3' },
    { id: 'p2', name: 'علي', score: 0, isImposter: false, vote: 'p3' },
    { id: 'p3', name: 'محمد', score: 0, isImposter: true, vote: 'p1' },
    { id: 'p4', name: 'جعفر', score: 0, isImposter: false, vote: 'p2' },
  ];

  // Case A: Imposter NOT caught
  const resultA = {
    wasImposterCaught: false,
    imposterId: 'p3',
    votes: { p1: 'p2', p2: 'p1', p3: 'p1', p4: 'p2' },
  };
  const deltasA = scoreEngine.calculateRoundScore(resultA, players);
  const updatedA = scoreEngine.applyDeltas(players, deltasA);
  assert(updatedA.find(p => p.id === 'p3').score === 200, 'Imposter gets +200 when NOT caught');
  assert(updatedA.find(p => p.id === 'p1').score === 0, 'Others get 0 when imposter not caught');

  // Case B: Imposter caught & guesses correctly
  const resultB = {
    wasImposterCaught: true,
    imposterGuessed: true,
    imposterId: 'p3',
    votes: { p1: 'p3', p2: 'p3', p3: 'p1', p4: 'p2' },
  };
  const deltasB = scoreEngine.calculateRoundScore(resultB, players);
  const updatedB = scoreEngine.applyDeltas(players, deltasB);
  assert(updatedB.find(p => p.id === 'p3').score === 200, 'Imposter gets +200 when caught and guesses secret');
  assert(updatedB.find(p => p.id === 'p1').score === 50, 'Correct voter p1 gets +50 when imposter guesses');
  assert(updatedB.find(p => p.id === 'p2').score === 50, 'Correct voter p2 gets +50 when imposter guesses');
  assert(updatedB.find(p => p.id === 'p4').score === 0, 'Wrong voter p4 gets 0');

  // Case C: Imposter caught & fails guess
  const resultC = {
    wasImposterCaught: true,
    imposterGuessed: false,
    imposterId: 'p3',
    votes: { p1: 'p3', p2: 'p3', p3: 'p1', p4: 'p2' },
  };
  const deltasC = scoreEngine.calculateRoundScore(resultC, players);
  const updatedC = scoreEngine.applyDeltas(players, deltasC);
  assert(updatedC.find(p => p.id === 'p3').score === 0, 'Imposter gets 0 when caught and fails guess');
  assert(updatedC.find(p => p.id === 'p1').score === 150, 'Correct voter p1 gets +150 when imposter fails');
  assert(updatedC.find(p => p.id === 'p2').score === 150, 'Correct voter p2 gets +150 when imposter fails');

  console.log('\n--- 2. Testing TurnEngine Graph Fairness (3 to 20 players) ---');
  for (const count of [3, 4, 8, 20]) {
    const testPlayers = Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));
    const turnEngine = new TurnEngine(testPlayers);

    let validPairs = true;
    let selfTarget = false;
    for (let q = 0; q < count * 2; q++) {
      const turn = turnEngine.getCurrentTurn();
      if (!turn || !turn.asker || !turn.target) validPairs = false;
      if (turn.asker.id === turn.target.id) selfTarget = true;
      turnEngine.nextTurn();
    }
    assert(validPairs && !selfTarget, `TurnEngine generates valid non-self question pairs for ${count} players`);
  }

  console.log('\n--- 3. Testing RoleAssigner ---');
  const rolePlayers = [
    { id: 'p1', name: 'أحمد' },
    { id: 'p2', name: 'سعد' },
    { id: 'p3', name: 'خالد' },
  ];
  const assigned = RoleAssigner.assign(rolePlayers, { id: 'secret_1', text: 'أسد' });
  const imposters = assigned.filter(p => p.isImposter);
  assert(imposters.length === 1, 'RoleAssigner assigns exactly ONE imposter');
  assert(assigned.filter(p => !p.isImposter).length === 2, 'RoleAssigner leaves remaining players as insiders');

  console.log('\n--- 4. Testing VotingEngine & Tie Detection ---');
  const votePlayersNoTie = [
    { id: 'p1', name: 'أ', vote: 'p3' },
    { id: 'p2', name: 'ب', vote: 'p3' },
    { id: 'p3', name: 'ج', vote: 'p1' },
  ];
  const voteResultNoTie = VotingEngine.getVoteResult(votePlayersNoTie);
  assert(!voteResultNoTie.isTie && voteResultNoTie.winners[0] === 'p3', 'VotingEngine finds single winner');

  const votePlayersTie = [
    { id: 'p1', name: 'أ', vote: 'p2' },
    { id: 'p2', name: 'ب', vote: 'p1' },
    { id: 'p3', name: 'ج', vote: 'p1' },
    { id: 'p4', name: 'د', vote: 'p2' },
  ];
  const voteResultTie = VotingEngine.getVoteResult(votePlayersTie);
  assert(voteResultTie.isTie && voteResultTie.winners.length === 2, 'VotingEngine correctly detects tie');

  console.log('\n--- 5. Testing Content Database Pool ---');
  const allContent = await ContentManager.getAllItems();
  console.log(`  Total content items loaded: ${allContent.length}`);
  assert(allContent.length >= 500, `Content pool exceeds 500+ items (current: ${allContent.length})`);

  console.log('\n--- 6. Testing GuessEngine Options ---');
  const secretItem = { id: 'ani_001', text: 'أسد', category: 'animals' };
  const guessOpts = await GuessEngine.buildOptions(secretItem, 6);
  assert(guessOpts.length === 6, 'GuessEngine generates exactly 6 options');
  assert(guessOpts.filter(o => o.isCorrect).length === 1, 'GuessEngine includes exactly 1 correct secret');
  assert(guessOpts.find(o => o.item.text === 'أسد') !== undefined, 'Secret word is present in choices');

  console.log(`\n========================================`);
  console.log(`Test Summary: Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Error running test script:', err);
  process.exit(1);
});
