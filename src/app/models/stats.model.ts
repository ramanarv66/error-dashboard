export interface StatCard {
  label: string;
  value: number | string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon?: string;
}