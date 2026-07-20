// src/config/conveyanceRates.js

// 👇 Yahi ek jagah rates change karo, poore system me apply ho jayega
export const CONVEYANCE_RATES = {
  bike: [
    { minKm: 0, maxKm: 5, ratePerKm: 4 },
    { minKm: 5, maxKm: null, ratePerKm: 5 }
  ],
  car: [
    { minKm: 0, maxKm: 5, ratePerKm: 8 },
    { minKm: 5, maxKm: null, ratePerKm: 10 }
  ],
  auto: [
    { minKm: 0, maxKm: 5, ratePerKm: 6 },
    { minKm: 5, maxKm: null, ratePerKm: 7 }
  ],
  taxi: [
    { minKm: 0, maxKm: 5, ratePerKm: 12 },
    { minKm: 5, maxKm: null, ratePerKm: 14 }
  ],
  public_transport: [
    { minKm: 0, maxKm: null, ratePerKm: 2 }
  ],
  own_vehicle: [
    { minKm: 0, maxKm: 5, ratePerKm: 5 },
    { minKm: 5, maxKm: null, ratePerKm: 6 }
  ]
};

// distance ke hisaab se sahi slab dhundh ke amount calculate karta hai
export function calculateConveyanceAmount(mode, distance) {
  const slabs = CONVEYANCE_RATES[mode];
  if (!slabs || !distance || distance <= 0) {
    return { amount: 0, ratePerKm: 0 };
  }

  const slab = slabs.find(
    s => distance > s.minKm && (s.maxKm === null || distance <= s.maxKm)
  ) || slabs[slabs.length - 1];

  const amount = Math.round(distance * slab.ratePerKm);
  return { amount, ratePerKm: slab.ratePerKm };
}