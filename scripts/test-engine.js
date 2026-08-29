/**
 * Comprehensive Engine Simulation and Verification Test
 */

import { StateMachine } from '../src/core/state/StateMachine.js';
import { createPlayer, resetPlayerForRound, applyScore } from '../src/core/models/Player.js';
import { createGameSession, updateSession, addRoundResult } from '../src/core/models/GameSession.js';
import { RandomEngine } from '../src/core/random/RandomEngine.js';
import { ScoreEngine } from '../src/core/scoring/ScoreEngine.js';
import { RoleAssigner } from '../src/games/barra-al-salfa/engine/RoleAssigner.js';
import { VotingEngine } from '../src/games/barra-al-salfa/engine/VotingEngine.js';
import { STATES, EVENTS, TRANSITIONS } from '../src/games/barra-al-salfa/engine/StateDefs.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('\n--- 1. Testing StateMachine ---');
const fsm = new StateMachine({
  initial: STATES.IDLE,
  transitions: TRANSITIONS,
});
assert(fsm.getState() === STATES.IDLE, 'FSM starts at IDLE');
assert(fsm.can(EVENTS.START_GAME), 'Can trigger START_GAME from IDLE');
fsm.send(EVENTS.START_GAME);
assert(fsm.getState() === STATES.PLAYER_SETUP, 'Transitions to PLAYER_SETUP');
fsm.send(EVENTS.CONFIRM_PLAYERS);
assert(fsm.getState() === STATES.ROLE_DISTRIBUTION, 'Transitions to ROLE_DISTRIBUTION');
fsm.send(EVENTS.ROLES_ASSIGNED);
assert(fsm.getState() === STATES.SECRET_REVEAL, 'Transitions to SECRET_REVEAL');
fsm.send(EVENTS.ALL_REVEALED);
assert(fsm.getState() === STATES.QUESTION_PHASE, 'Transitions to QUESTION_PHASE');
fsm.send(EVENTS.START_VOTING);
assert(fsm.getState() === STATES.VOTING, 'Transitions to VOTING');
fsm.send(EVENTS.ALL_VOTED);
assert(fsm.getState() === STATES.VOTE_RESULT, 'Transitions to VOTE_RESULT');

console.log('\n--- 2. Testing Player Model ---');
const player1 = createPlayer({ name: 'حسن' });
const player2 = createPlayer({ name: 'علي' });
const player3 = createPlayer({ name: 'محمد' });
assert(player1.name === 'حسن', 'Player name is correct');
assert(player1.score === 0, 'Initial score is 0');
const updatedPlayer = applyScore(player1, 100);
assert(updatedPlayer.score === 100, 'Score updated to 100');
assert(updatedPlayer.currentRoundScore === 100, 'Current round score is 100');
const resetP = resetPlayerForRound(updatedPlayer);
assert(resetP.currentRoundScore === 0, 'Round score reset');
assert(resetP.score === 100, 'Total score preserved');

console.log('\n--- 3. Testing RandomEngine ---');
const shuffled = RandomEngine.shuffle([1, 2, 3, 4, 5]);
assert(shuffled.length === 5, 'Shuffled array has same length');
const picked = RandomEngine.pick(['a', 'b', 'c']);
assert(['a', 'b', 'c'].includes(picked), 'Picked element is valid');
const pickEx = RandomEngine.pickExcluding(
  [{ id: '1' }, { id: '2' }, { id: '3' }],
  ['1', '2'],
  'id'
);
assert(pickEx.id === '3', 'pickExcluding respects exclusion list');

console.log('\n--- 4. Testing RoleAssigner ---');
const players = [player1, player2, player3];
const assigned = RoleAssigner.assign(players, { id: 'item_1', text: 'برغي' });
const imposter = RoleAssigner.getImposter(assigned);
const insiders = RoleAssigner.getInsiders(assigned);
assert(imposter !== null, 'Imposter assigned');
assert(insiders.length === 2, 'Two insiders assigned');
assert(assigned.filter(p => p.isImposter).length === 1, 'Exactly one imposter');

console.log('\n--- 5. Testing VotingEngine ---');
assigned[0].vote = imposter.id;
assigned[1].vote = imposter.id;
assigned[2].vote = insiders[0].id;
assert(VotingEngine.allVotescast(assigned), 'All votes cast recognized');
const voteResult = VotingEngine.getVoteResult(assigned);
assert(!voteResult.isTie, 'No tie when clear majority');
assert(voteResult.winners[0] === imposter.id, 'Imposter received most votes');

// Test tie detection
assigned[0].vote = assigned[1].id;
assigned[1].vote = assigned[0].id;
assigned[2].vote = assigned[0].id; // 2 votes for 0, 1 for 1 -> no tie
const voteResult2 = VotingEngine.getVoteResult(assigned);
assert(voteResult2.winners[0] === assigned[0].id, 'Clear winner in vote 2');

assigned[2].vote = assigned[1].id; // 1 vote for 0, 2 for 1 -> tie if 1 and 1
const tiedVotes = [
  { ...assigned[0], vote: assigned[1].id },
  { ...assigned[1], vote: assigned[0].id },
  { ...assigned[2], vote: null },
];
tiedVotes[2].vote = assigned[2].id; // vote for self if allowed or neutral
const tieRes = VotingEngine.getVoteResult([
  { ...assigned[0], vote: 'a' },
  { ...assigned[1], vote: 'b' },
  { ...assigned[2], vote: 'c' },
]);
assert(tieRes.isTie, 'Tie detected when votes are split equally');

console.log('\n--- 6. Testing ScoreEngine ---');
const scoreEngine = new ScoreEngine();

// Case A: Imposter caught, correct guess
const roundResultA = {
  roundNumber: 1,
  imposterId: imposter.id,
  wasImposterCaught: true,
  imposterGuessed: true,
  votes: {
    [assigned[0].id]: imposter.id,
    [assigned[1].id]: imposter.id,
  },
};
const deltasA = scoreEngine.calculateRoundScore(roundResultA, assigned);
const impDelta = deltasA.find(d => d.playerId === imposter.id && d.reason === 'imposter_correct_guess');
assert(impDelta && impDelta.points === 200, 'Imposter gets 200 pts for correct guess');

// Case B: Imposter not caught
const roundResultB = {
  roundNumber: 1,
  imposterId: imposter.id,
  wasImposterCaught: false,
  imposterGuessed: null,
  votes: {},
};
const deltasB = scoreEngine.calculateRoundScore(roundResultB, assigned);
const impDeltaB = deltasB.find(d => d.playerId === imposter.id && d.reason === 'imposter_wins');
assert(impDeltaB && impDeltaB.points === 150, 'Imposter gets 150 pts when escaping');

console.log(`\n========================================`);
console.log(`Summary: ${passedTests}/${totalTests} tests passed!`);
console.log(`========================================\n`);
