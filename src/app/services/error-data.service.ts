import { Injectable, signal, computed } from '@angular/core';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorLog } from '../models/error-log.model';
import { StatCard } from '../models/stats.model';
import { ChartData } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class ErrorDataService {

 // Using Angular 19 signals for reactive state management
  private errorLogs = signal<ErrorLog[]>([
    { id: 1, errorType: 'DEBUG', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
    { id: 2, errorType: 'INFO', message: 'com.example.co', date: '2025-08-21', time: '14:01:33.511' },
    { id: 3, errorType: 'ERROR', message: 'com.example.Ma', date: '2025-08-21', time: '14:01:33.511' },
    { id: 4, errorType: 'DEBUG', message: 'com.example.da', date: '2025-08-21', time: '14:01:33.511' },
    { id: 5, errorType: 'INFO', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
    { id: 6, errorType: 'DEBUG', message: 'com.example.se', date: '2025-08-21', time: '14:01:33.511' },
    { id: 7, errorType: 'WARN', message: 'com.example.da', date: '2025-08-21', time: '14:01:33.511' },
    { id: 8, errorType: 'INFO', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
    { id: 9, errorType: 'ERROR', message: 'com.example.se', date: '2025-08-21', time: '14:01:33.511' }
  ]);

  private newErrorCount = new BehaviorSubject<number>(0);
  
  // Computed signals for reactive calculations
  readonly totalErrors = computed(() => 
    this.errorLogs().filter(log => log.errorType === 'ERROR').length
  );
  
  readonly totalWarnings = computed(() => 
    this.errorLogs().filter(log => log.errorType === 'WARN').length
  );
  
  readonly totalInfo = computed(() => 
    this.errorLogs().filter(log => log.errorType === 'INFO').length
  );
  
  readonly totalDebug = computed(() => 
    this.errorLogs().filter(log => log.errorType === 'DEBUG').length
  );
  
  readonly systemHealth = computed(() => {
    const total = this.errorLogs().length;
    const errors = this.totalErrors();
    return total > 0 ? Math.round((1 - errors / total) * 100) : 100;
  });

  constructor() {
    // Simulate real-time error updates
    this.startRealTimeSimulation();
  }

  getErrorLogs(): ErrorLog[] {
    return this.errorLogs();
  }

  getStats(): StatCard[] {
    return [
      {
        label: 'Total Errors',
        value: this.totalErrors(),
        trend: '↑ 12% from last hour',
        trendDirection: 'up'
      },
      {
        label: 'Warnings',
        value: this.totalWarnings(),
        trend: '↓ 5% from last hour',
        trendDirection: 'down'
      },
      {
        label: 'Total Logs',
        value: this.errorLogs().length,
        trend: 'Real-time monitoring',
        trendDirection: 'neutral'
      },
      {
        label: 'System Health',
        value: `${this.systemHealth()}%`,
        trend: 'Optimal performance',
        trendDirection: this.systemHealth() > 80 ? 'up' : 'down'
      }
    ];
  }

  getChartData(): { trendData: ChartData; distributionData: ChartData } {
    return {
      trendData: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
        datasets: [
          {
            label: 'Errors',
            data: [3, 5, 2, 8, 4, 6, 2],
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Warnings',
            data: [1, 3, 4, 2, 5, 3, 1],
            borderColor: '#ffcc00',
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Info',
            data: [10, 15, 12, 18, 14, 16, 13],
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      distributionData: {
        labels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
        datasets: [{
          label: 'Distribution',
          data: [
            this.totalErrors(),
            this.totalWarnings(),
            this.totalInfo(),
            this.totalDebug()
          ],
          backgroundColor: [
            'rgba(255, 59, 48, 0.7)',
            'rgba(255, 204, 0, 0.7)',
            'rgba(0, 122, 255, 0.7)',
            'rgba(175, 82, 222, 0.7)'
          ]
        }]
      }
    };
  }

  getNewErrorCount(): Observable<number> {
    return this.newErrorCount.asObservable();
  }

  refreshData(): void {
    this.newErrorCount.next(0);
    // Simulate data refresh
    console.log('Data refreshed');
  }

  private startRealTimeSimulation(): void {
    interval(5000).subscribe(() => {
      if (Math.random() > 0.7) {
        const count = Math.floor(Math.random() * 5) + 1;
        this.newErrorCount.next(count);
      }
    });
  }
}
