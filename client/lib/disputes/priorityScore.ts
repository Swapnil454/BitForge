export function computeDisputePriority(
  amount: number,
  createdAt: string
): 'low' | 'medium' | 'high' {
  const daysOpen = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (amount > 1000 || daysOpen > 7) return 'high';
  if (amount > 200 || daysOpen > 3) return 'medium';
  return 'low';
}
