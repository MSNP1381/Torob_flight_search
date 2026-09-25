export const formatRial = (amount: number): string => {
  return `${amount.toLocaleString('fa-IR')} ریال`;
};

export const formatToman = (amount: number): string => {
  const toman = Math.round(amount / 10);
  return `${toman.toLocaleString('fa-IR')} تومان`;
};
