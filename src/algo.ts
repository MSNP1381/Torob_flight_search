/**
 * algo.ts
 * Multi-Criteria Flight Ranking Algorithm using Matrix Multiplication.
 *
 * S = X * W
 * where:
 *   X in R^(N x M): Session-normalized flight feature matrix (N flights, M criteria)
 *   W in R^(M x 1): Importance weight matrix / vector
 *   S in R^(N x 1): Resulting score vector
 */

export interface FlightWeightConfig {
  price: number;
  duration: number;
  stops: number;
  timeOfDay: number;
  baggage: number;
  systemic: number;
  airlineClass: number;
  providerCompetition: number;
}

export type PresetProfileName = 'bestDeal' | 'business' | 'student' | 'family' | 'fastest';

/**
 * Class representing the Weight Matrix (W).
 * Encapsulates the relative importance of each parameter and provides
 * ready-to-use personas (Family, Business, Student, Best Deal, Fastest).
 */
export class FlightWeightMatrix {
  public price: number;
  public duration: number;
  public stops: number;
  public timeOfDay: number;
  public baggage: number;
  public systemic: number;
  public airlineClass: number;
  public providerCompetition: number;

  constructor(config: Partial<FlightWeightConfig> = {}) {
    this.price = config.price ?? 0.35;
    this.duration = config.duration ?? 0.20;
    this.stops = config.stops ?? 0.15;
    this.timeOfDay = config.timeOfDay ?? 0.10;
    this.baggage = config.baggage ?? 0.08;
    this.systemic = config.systemic ?? 0.05;
    this.airlineClass = config.airlineClass ?? 0.04;
    this.providerCompetition = config.providerCompetition ?? 0.03;

    this.normalize();
  }

  /**
   * Normalizes all weights so that their sum equals exactly 1.0.
   */
  public normalize(): this {
    const sum =
      this.price +
      this.duration +
      this.stops +
      this.timeOfDay +
      this.baggage +
      this.systemic +
      this.airlineClass +
      this.providerCompetition;

    if (sum > 0) {
      this.price = this.price / sum;
      this.duration = this.duration / sum;
      this.stops = this.stops / sum;
      this.timeOfDay = this.timeOfDay / sum;
      this.baggage = this.baggage / sum;
      this.systemic = this.systemic / sum;
      this.airlineClass = this.airlineClass / sum;
      this.providerCompetition = this.providerCompetition / sum;
    }
    return this;
  }

  /**
   * Converts the weight matrix into an array vector matching the feature matrix columns:
   * [price, duration, stops, timeOfDay, baggage, systemic, airlineClass, providerCompetition]
   */
  public toVector(): number[] {
    return [
      this.price,
      this.duration,
      this.stops,
      this.timeOfDay,
      this.baggage,
      this.systemic,
      this.airlineClass,
      this.providerCompetition,
    ];
  }

  /**
   * Preset: Best Deal / Balanced
   * Balanced optimization between price, duration, comfort and schedule.
   */
  public static bestDeal(): FlightWeightMatrix {
    return new FlightWeightMatrix({
      price: 0.35,
      duration: 0.20,
      stops: 0.15,
      timeOfDay: 0.10,
      baggage: 0.08,
      systemic: 0.05,
      airlineClass: 0.04,
      providerCompetition: 0.03,
    });
  }

  /**
   * Preset: Business Traveler
   * Minimizes travel time, prioritizes direct routes and prime daytime hours, price-insensitive.
   */
  public static business(): FlightWeightMatrix {
    return new FlightWeightMatrix({
      price: 0.05,
      duration: 0.35,
      stops: 0.25,
      timeOfDay: 0.18,
      baggage: 0.04,
      systemic: 0.08,
      airlineClass: 0.05, // Airline class / reliability
      providerCompetition: 0.00,
    });
  }

  /**
   * Preset: Student / Budget Traveler
   * Highly price-sensitive, demands high baggage allowance (bringing luggage),
   * willing to tolerate stops and non-prime departure hours.
   */
  public static student(): FlightWeightMatrix {
    return new FlightWeightMatrix({
      price: 0.52,
      duration: 0.08,
      stops: 0.05,
      timeOfDay: 0.05,
      baggage: 0.20,
      systemic: 0.05,
      airlineClass: 0.02,
      providerCompetition: 0.03,
    });
  }

  /**
   * Preset: Family Traveler (Dynamic by count of kids and adults)
   * With children:
   *  - Stops become heavily penalized (traveling with strollers/kids during layovers is exhausting).
   *  - Baggage importance scales with total family members.
   *  - Convenient daytime hours are critical (avoiding late nights/early dawn).
   *  - Systemic tickets are strongly preferred over charter (lower risk of abrupt changes/non-refunds).
   */
  public static family(kidsCount: number = 1, adultsCount: number = 2): FlightWeightMatrix {
    const totalPassengers = Math.max(1, adultsCount + kidsCount);
    const hasKids = kidsCount > 0;

    // Dynamically adjust weights based on passenger composition
    const stopsWeight = hasKids ? 0.25 + Math.min(0.10, kidsCount * 0.05) : 0.15;
    const timeOfDayWeight = hasKids ? 0.20 : 0.12;
    const baggageWeight = Math.min(0.25, 0.10 + totalPassengers * 0.03);
    const systemicWeight = hasKids ? 0.12 : 0.08;
    const airlineClassWeight = 0.05;
    const durationWeight = 0.15;
    const providerCompetitionWeight = 0.02;

    // Price takes the remaining balance to keep total = 1.0 before normalization
    const priceWeight = Math.max(
      0.15,
      1.0 - (stopsWeight + timeOfDayWeight + baggageWeight + systemicWeight + airlineClassWeight + durationWeight + providerCompetitionWeight)
    );

    return new FlightWeightMatrix({
      price: priceWeight,
      duration: durationWeight,
      stops: stopsWeight,
      timeOfDay: timeOfDayWeight,
      baggage: baggageWeight,
      systemic: systemicWeight,
      airlineClass: airlineClassWeight,
      providerCompetition: providerCompetitionWeight,
    });
  }

  /**
   * Preset: Fastest Flight
   * Strictly prioritizes shortest flight time, 0 stops, and fastest path.
   */
  public static fastest(): FlightWeightMatrix {
    return new FlightWeightMatrix({
      price: 0.05,
      duration: 0.50,
      stops: 0.30,
      timeOfDay: 0.08,
      baggage: 0.02,
      systemic: 0.03,
      airlineClass: 0.02,
      providerCompetition: 0.00,
    });
  }
}

/**
 * Minimal structure needed from flight cards for algorithmic scoring.
 */
export interface ScorableFlightCard {
  id: string; // Flight hash_id
  airline?: {
    iata?: string;
    code?: string;
    name?: string;
  };
  departureAt: string;
  durationMinutes: number;
  stops: number;
  providerCount?: number;
  providers?: Array<{
    totalPrice: number;
    baggage?: string;
    isCharter?: boolean;
    cancellationPolicy?: string;
  }>;
  bestPrice: {
    totalPrice: number;
    baggage?: string;
    isCharter?: boolean;
  };
}

/**
 * Helper: Parses baggage string into kilograms.
 * e.g., "20 کیلوگرم" -> 20, "1 pc (23kg)" -> 23, "بدون بار" -> 0
 */
export function parseBaggageKg(baggageStr?: string): number {
  if (!baggageStr) return 20; // Default standard allowance
  if (baggageStr.includes('بدون') || baggageStr.includes('0') && baggageStr.includes('کیلو')) {
    return 0;
  }
  const match = baggageStr.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? 20 : val;
  }
  return 20;
}

/**
 * Helper: Calculates circadian time-of-day convenience utility [0, 1].
 * Peak comfortable hours (8:00 - 12:00, 16:00 - 20:00) yield ~1.0.
 * Red-eye flights (00:00 - 05:59) yield ~0.20.
 */
export function calculateTimeOfDayUtility(departureIso: string): number {
  const date = new Date(departureIso);
  const hour = date.getHours() + date.getMinutes() / 60;

  if (hour >= 8 && hour <= 12) return 1.0;
  if (hour >= 16 && hour <= 20) return 0.95;
  if (hour > 12 && hour < 16) return 0.85;
  if (hour >= 6 && hour < 8) return 0.70;
  if (hour > 20 && hour <= 23) return 0.55;
  return 0.20; // Red-eye: 00:00 - 05:59
}

/**
 * Mock Airline Class / Quality Evaluator.
 * Per specification: All airlines return 1.0 for now as a mock placeholder,
 * ready to be connected to live rating/cabin data in the future.
 */
export function getAirlineClassScore(_iataOrCode?: string): number {
  // Mocked to 1.0 as requested
  return 1.0;
}

/**
 * Computes scores for all flight cards in a search session using matrix multiplication.
 *
 * @param cards Array of flight cards in the current session
 * @param weightMatrix The weight matrix / persona to apply
 * @returns A dictionary mapping flight card hash_id (card.id) to its final score [0.0 - 1.0]
 */
export function computeFlightScores<T extends ScorableFlightCard>(
  cards: T[],
  weightMatrix: FlightWeightMatrix
): Record<string, number> {
  const scoresDict: Record<string, number> = {};

  if (!cards || cards.length === 0) {
    return scoresDict;
  }

  // 1. Session Base Benchmarks
  const prices = cards.map((c) => c.bestPrice.totalPrice);
  const durations = cards.map((c) => c.durationMinutes);
  const baggages = cards.map((c) => parseBaggageKg(c.bestPrice.baggage));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  const maxBaggage = Math.max(20, ...baggages);

  // 2. Weight Vector W (M x 1)
  const W = weightMatrix.toVector();

  // 3. Construct Normalized Feature Matrix X (N x M) and compute X * W
  for (const card of cards) {
    // Feature 0: Price Utility (Inverted relative min-max, cost parameter)
    const priceScore =
      maxPrice === minPrice ? 1.0 : (maxPrice - card.bestPrice.totalPrice) / (maxPrice - minPrice);

    // Feature 1: Duration Utility (Inverted relative min-max, cost parameter)
    const durationScore =
      maxDuration === minDuration
        ? 1.0
        : (maxDuration - card.durationMinutes) / (maxDuration - minDuration);

    // Feature 2: Stops Utility (0 stops = 1.0, 1 stop = 0.6, 2+ stops = 0.2)
    const stopsScore = Math.max(0, 1 - card.stops * 0.4);

    // Feature 3: Schedule Convenience (Circadian departure utility)
    const timeOfDayScore = calculateTimeOfDayUtility(card.departureAt);

    // Feature 4: Baggage Utility (Relative to session maximum)
    const baggageKg = parseBaggageKg(card.bestPrice.baggage);
    const baggageScore = maxBaggage > 0 ? Math.min(1.0, baggageKg / maxBaggage) : 1.0;

    // Feature 5: Systemic vs Charter Policy Trust
    const isCharter = card.bestPrice.isCharter ?? false;
    const systemicScore = isCharter ? 0.45 : 1.0;

    // Feature 6: Airline Class (Mocked to 1.0 per requirement)
    const airlineScore = getAirlineClassScore(card.airline?.iata || card.airline?.code);

    // Feature 7: Provider Competition Score (Torob aggregator utility)
    const pCount = card.providerCount || card.providers?.length || 1;
    const competitionScore = Math.min(1.0, pCount / 4);

    // Row vector x_i (1 x M)
    const x_i = [
      priceScore,
      durationScore,
      stopsScore,
      timeOfDayScore,
      baggageScore,
      systemicScore,
      airlineScore,
      competitionScore,
    ];

    // Dot product: S_i = x_i * W
    let dotProduct = 0;
    for (let j = 0; j < x_i.length; j++) {
      dotProduct += x_i[j] * W[j];
    }

    // Clamp score to [0, 1] and round to 4 decimals
    const finalScore = Math.min(1.0, Math.max(0.0, Math.round(dotProduct * 10000) / 10000));
    scoresDict[card.id] = finalScore;
  }

  return scoresDict;
}

/**
 * Re-arranges flight cards in descending order of their computed matrix score.
 *
 * @param cards Array of flight cards
 * @param scores Dictionary of scores by card.id
 * @returns Re-ordered array of flight cards
 */
export function rankFlightCards<T extends ScorableFlightCard>(
  cards: T[],
  scores: Record<string, number>
): T[] {
  return [...cards].sort((a, b) => {
    const scoreA = scores[a.id] ?? 0;
    const scoreB = scores[b.id] ?? 0;
    return scoreB - scoreA;
  });
}
