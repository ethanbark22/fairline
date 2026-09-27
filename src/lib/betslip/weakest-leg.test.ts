import { describe, expect, it } from "vitest";
import { findWeakestLeg } from "./weakest-leg";

describe("findWeakestLeg", () => {
  it("returns null for an empty list", () => {
    expect(findWeakestLeg([])).toBeNull();
  });

  it("returns null for a single leg — 'weakest' needs something to compare to", () => {
    expect(findWeakestLeg([{ price: 2.5 }])).toBeNull();
  });

  it("picks the leg with the longest price", () => {
    const legs = [{ id: "a", price: 2.05 }, { id: "b", price: 4.3 }, { id: "c", price: 1.95 }];
    expect(findWeakestLeg(legs)).toEqual({ id: "b", price: 4.3 });
  });

  it("picks the first of equally-long prices", () => {
    const legs = [{ id: "a", price: 3.0 }, { id: "b", price: 3.0 }];
    expect(findWeakestLeg(legs)).toEqual({ id: "a", price: 3.0 });
  });
});
