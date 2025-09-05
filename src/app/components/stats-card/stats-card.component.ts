import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCard } from '../../models/stats.model';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class.trend-up]="stat.trendDirection === 'up'"
         [class.trend-down]="stat.trendDirection === 'down'">
      <div class="stat-label">{{ stat.label }}</div>
      <div class="stat-value">{{ stat.value }}</div>
      <div class="stat-trend">
        <span class="trend-icon">{{ getTrendIcon() }}</span>
        {{ stat.trend }}
      </div>
    </div>
  `,
  styleUrls: ['./stats-card.component.scss']
})
export class StatsCardComponent {
  @Input() stat!: StatCard;

  getTrendIcon(): string {
    switch(this.stat.trendDirection) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  }
}