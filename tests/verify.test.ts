import { describe, it, expect } from 'vitest';
import { calculateComplexityScore } from '../src/lib/verify';

describe('calculateComplexityScore', () => {
  it('should return a base score for an empty repo', () => {
    const score = calculateComplexityScore(0, 0, 0, false, false);
    expect(score).toBe(10);
  });

  it('should calculate score for a small repo', () => {
    // 100 LOC = log10(100)*10 = 20 points
    // 1 contributor = 5 points
    // 1 language = 5 points
    // Base 10
    // Total = 10 + 20 + 5 + 5 = 40
    const score = calculateComplexityScore(100, 1, 1, false, false);
    expect(score).toBe(40);
  });

  it('should correctly cap max language and contributor points', () => {
    // 10000 LOC = log10(10000)*10 = 40
    // 10 contributors = 50 points, capped at 25
    // 5 languages = 25 points, capped at 15
    // Base 10
    // Total = 10 + 40 + 25 + 15 = 90
    const score = calculateComplexityScore(10000, 10, 5, false, false);
    expect(score).toBe(90);
  });

  it('should add points for CI and tests', () => {
    const scoreWithout = calculateComplexityScore(100, 1, 1, false, false); // 40
    const scoreWithBoth = calculateComplexityScore(100, 1, 1, true, true); // 40 + 10 + 10 = 60
    expect(scoreWithBoth).toBe(60);
  });

  it('should not exceed 100 points', () => {
    // Very large repo
    const score = calculateComplexityScore(10000000, 100, 20, true, true);
    expect(score).toBe(100);
  });
});
