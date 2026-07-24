export const toCentimes = (dh: number): number => {
  return Math.round(dh * 100);
};

export const fromCentimes = (centimes: number): number => {
  return centimes / 100;
};

export const formatDH = (centimes: number): string => {
  return fromCentimes(centimes).toFixed(2) + ' DH';
};
