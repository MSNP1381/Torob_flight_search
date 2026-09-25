import { FlightWeightMatrix, computeFlightScores, rankFlightCards, ScorableFlightCard } from '../src/algo';

const mockCards: ScorableFlightCard[] = [
  {
    id: 'hash_flight_expensive_fast',
    airline: { iata: 'W5', name: 'Mahan' },
    departureAt: '2026-09-26T09:00:00Z',
    durationMinutes: 80,
    stops: 0,
    providerCount: 3,
    bestPrice: { totalPrice: 3200000, baggage: '25 kg', isCharter: false },
  },
  {
    id: 'hash_flight_cheap_slow',
    airline: { iata: 'TB', name: 'Taban' },
    departureAt: '2026-09-26T04:30:00Z',
    durationMinutes: 140,
    stops: 1,
    providerCount: 1,
    bestPrice: { totalPrice: 1500000, baggage: '15 kg', isCharter: true },
  },
  {
    id: 'hash_flight_balanced',
    airline: { iata: 'IR', name: 'IranAir' },
    departureAt: '2026-09-26T17:00:00Z',
    durationMinutes: 85,
    stops: 0,
    providerCount: 4,
    bestPrice: { totalPrice: 2100000, baggage: '20 kg', isCharter: false },
  },
];

console.log('--- Testing Best Deal ---');
const bestDealMatrix = FlightWeightMatrix.bestDeal();
const scoresBestDeal = computeFlightScores(mockCards, bestDealMatrix);
console.log('Scores Best Deal:', scoresBestDeal);
const rankedBestDeal = rankFlightCards(mockCards, scoresBestDeal);
console.log('Ranked Best Deal:', rankedBestDeal.map(c => ({ id: c.id, score: scoresBestDeal[c.id] })));

console.log('\n--- Testing Business (Should rank fast/prime Mahan first) ---');
const businessMatrix = FlightWeightMatrix.business();
const scoresBusiness = computeFlightScores(mockCards, businessMatrix);
console.log('Ranked Business:', rankFlightCards(mockCards, scoresBusiness).map(c => ({ id: c.id, score: scoresBusiness[c.id] })));

console.log('\n--- Testing Student (Should rank cheapest first) ---');
const studentMatrix = FlightWeightMatrix.student();
const scoresStudent = computeFlightScores(mockCards, studentMatrix);
console.log('Ranked Student:', rankFlightCards(mockCards, scoresStudent).map(c => ({ id: c.id, score: scoresStudent[c.id] })));

console.log('\n--- Testing Family (2 adults, 2 kids) ---');
const familyMatrix = FlightWeightMatrix.family(2, 2);
const scoresFamily = computeFlightScores(mockCards, familyMatrix);
console.log('Family Weights:', familyMatrix);
console.log('Ranked Family:', rankFlightCards(mockCards, scoresFamily).map(c => ({ id: c.id, score: scoresFamily[c.id] })));

console.log('\n--- Testing Fastest ---');
const fastestMatrix = FlightWeightMatrix.fastest();
const scoresFastest = computeFlightScores(mockCards, fastestMatrix);
console.log('Ranked Fastest:', rankFlightCards(mockCards, scoresFastest).map(c => ({ id: c.id, score: scoresFastest[c.id] })));

console.log('\nAll tests executed successfully!');
