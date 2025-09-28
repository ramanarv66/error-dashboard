import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, throwError, of, Subject } from 'rxjs';
import { 
  catchError, 
  retry, 
  tap, 
  map, 
  switchMap, 
  takeUntil,
  shareReplay,
  finalize
} from 'rxjs/operators';
import { ErrorLog } from '../models/error-log.model';
import { StatCard } from '../models/stats.model';
import { ChartData } from 'chart.js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorDataService {
  private readonly apiUrl = environment.n8nWebhookUrl;
  private readonly refreshInterval = environment.refreshInterval || 30000;
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);

  // Loading and error states
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public lastUpdateTime = signal<Date | null>(null);
  
  // Core data signals
  private errorLogs = signal<ErrorLog[]>([]);
  private previousLogs = signal<ErrorLog[]>([]);
  
  // Behavior subjects for real-time updates
  private newErrorCount = new BehaviorSubject<number>(0);
  private autoRefresh$ = new BehaviorSubject<boolean>(true);
  
  // Computed signals for reactive calculations
  readonly totalErrors = computed(() => {
    const logs = this.errorLogs();
    return logs.filter(log => log.log_level === 'ERROR').length;
  });
  
  readonly totalWarnings = computed(() => {
    const logs = this.errorLogs();
    return logs.filter(log => log.log_level === 'WARN').length;
  });
  
  readonly totalInfo = computed(() => {
    const logs = this.errorLogs();
    return logs.filter(log => log.log_level === 'INFO').length;
  });
  
  readonly totalDebug = computed(() => {
    const logs = this.errorLogs();
    return logs.filter(log => log.log_level === 'DEBUG').length;
  });
  
  readonly systemHealth = computed(() => {
    const total = this.errorLogs().length;
    const errors = this.totalErrors();
    if (total === 0) return 100;
    return Math.round((1 - errors / total) * 100);
  });

  constructor() {
    this.initializeEmptyState();
    if (environment.enableRealTimeUpdates) {
      this.setupAutoRefresh();
    }
  }

  private initializeEmptyState(): void {
    this.errorLogs.set([]);
    this.lastUpdateTime.set(null);
  }

  private setupAutoRefresh(): void {
    this.autoRefresh$
      .pipe(
        switchMap(shouldRefresh => 
          shouldRefresh ? timer(this.refreshInterval, this.refreshInterval) : of(null)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.autoRefresh$.value && this.errorLogs().length > 0) {
          this.refreshData();
        }
      });
  }

  processUploadedLogs(responseData: any): void {
    if (responseData && Array.isArray(responseData)) {
      const parsedLogs = this.parseLogData(responseData);
      
      this.previousLogs.set(this.errorLogs());
      this.errorLogs.set(parsedLogs);
      this.lastUpdateTime.set(new Date());
      
      this.checkForNewErrors(parsedLogs);
    }
  }

  private parseLogData(data: any[]): ErrorLog[] {
    return data.map((item, index) => ({
      id: index + 1,
      date: item.date,
      time: item.time,
      thread_id: item.thread_id,
      log_level: item.log_level as 'ERROR' | 'WARN' | 'INFO' | 'DEBUG',
      message: item.message
    }));
  }

  getErrorLogs(): ErrorLog[] {
    return this.errorLogs();
  }

  getStats(): StatCard[] {
    // Access computed signals by calling them as functions
    const errorCount = this.totalErrors();
    const warningCount = this.totalWarnings();
    const infoCount = this.totalInfo();
    const debugCount = this.totalDebug();
    const systemHealthValue = this.systemHealth();
    
    return [
      {
        label: 'Total Errors',
        value: errorCount,
        trend: this.errorLogs().length > 0 ? 'Monitoring active' : 'Upload file to start',
        trendDirection: errorCount > 0 ? 'down' : 'neutral'
      },
      {
        label: 'Warnings',
        value: warningCount,
        trend: this.errorLogs().length > 0 ? 'System warnings' : 'No data',
        trendDirection: warningCount > 0 ? 'down' : 'neutral'
      },
      {
        label: 'Total Logs',
        value: this.errorLogs().length,
        trend: this.errorLogs().length > 0 ? 'Logs loaded' : 'Awaiting upload',
        trendDirection: 'neutral'
      },
      {
        label: 'System Health',
        value: `${systemHealthValue}%`,
        trend: systemHealthValue > 80 ? 'Optimal' : 'Needs attention',
        trendDirection: systemHealthValue > 80 ? 'up' : 'down'
      }
    ];
  }

  // CORRECTED getChartData method
  // getChartData(): { trendData: ChartData; distributionData: ChartData } {
  //   const logs = this.errorLogs();
    
  //   // Group logs by time intervals for better visualization
  //   const timeGroups = this.groupLogsByTimeInterval(logs);
    
  //   // Access computed signals by calling them as functions
  //   const errorCount = this.totalErrors();
  //   const warningCount = this.totalWarnings();
  //   const infoCount = this.totalInfo();
  //   const debugCount = this.totalDebug();
    
  //   return {
  //     // STACKED LINE CHART DATA
  //     trendData: {
  //       labels: Object.keys(timeGroups).slice(0, 10), // Show last 10 time points
  //       datasets: [
  //         {
  //           label: 'Errors',
  //           data: Object.values(timeGroups).slice(0, 10).map((group: any) => 
  //             group.filter((l: any) => l.log_level === 'ERROR').length
  //           ),
  //           borderColor: '#ff3b30',
  //           backgroundColor: 'rgba(255, 59, 48, 0.3)',
  //           fill: true,
  //           tension: 0.3,
  //           pointBackgroundColor: '#ff3b30',
  //           pointBorderColor: '#fff',
  //           pointBorderWidth: 2,
  //           pointRadius: 4,
  //           pointHoverRadius: 6,
  //           stack: 'Stack 0'
  //         },
  //         {
  //           label: 'Warnings',
  //           data: Object.values(timeGroups).slice(0, 10).map((group: any) => 
  //             group.filter((l: any) => l.log_level === 'WARN').length
  //           ),
  //           borderColor: '#ffcc00',
  //           backgroundColor: 'rgba(255, 204, 0, 0.3)',
  //           fill: true,
  //           tension: 0.3,
  //           pointBackgroundColor: '#ffcc00',
  //           pointBorderColor: '#fff',
  //           pointBorderWidth: 2,
  //           pointRadius: 4,
  //           pointHoverRadius: 6,
  //           stack: 'Stack 0'
  //         },
  //         {
  //           label: 'Info',
  //           data: Object.values(timeGroups).slice(0, 10).map((group: any) => 
  //             group.filter((l: any) => l.log_level === 'INFO').length
  //           ),
  //           borderColor: '#007aff',
  //           backgroundColor: 'rgba(0, 122, 255, 0.3)',
  //           fill: true,
  //           tension: 0.3,
  //           pointBackgroundColor: '#007aff',
  //           pointBorderColor: '#fff',
  //           pointBorderWidth: 2,
  //           pointRadius: 4,
  //           pointHoverRadius: 6,
  //           stack: 'Stack 0'
  //         },
  //         {
  //           label: 'Debug',
  //           data: Object.values(timeGroups).slice(0, 10).map((group: any) => 
  //             group.filter((l: any) => l.log_level === 'DEBUG').length
  //           ),
  //           borderColor: '#af52de',
  //           backgroundColor: 'rgba(175, 82, 222, 0.3)',
  //           fill: true,
  //           tension: 0.3,
  //           pointBackgroundColor: '#af52de',
  //           pointBorderColor: '#fff',
  //           pointBorderWidth: 2,
  //           pointRadius: 4,
  //           pointHoverRadius: 6,
  //           stack: 'Stack 0'
  //         }
  //       ]
  //     } as ChartData,
      
  //     // DOUGHNUT CHART DATA - CORRECTED
  //     distributionData: {
  //       labels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
  //       datasets: [{
  //         label: 'Distribution',
  //         data: [
  //           errorCount,      // Use the variables we created above
  //           warningCount,    // Not this.totalWarnings()
  //           infoCount,       // Not this.totalInfo()
  //           debugCount       // Not this.totalDebug()
  //         ],
  //         backgroundColor: [
  //           'rgba(255, 59, 48, 0.7)',
  //           'rgba(255, 204, 0, 0.7)',
  //           'rgba(0, 122, 255, 0.7)',
  //           'rgba(175, 82, 222, 0.7)'
  //         ],
  //         borderColor: [
  //           '#ff3b30',
  //           '#ffcc00',
  //           '#007aff',
  //           '#af52de'
  //         ],
  //         borderWidth: 2,
  //         hoverOffset: 4
  //       }]
  //     } as ChartData
  //   };
  // }

//   getChartData(): { trendData: ChartData; distributionData: ChartData } {
//   const logs = this.errorLogs();
  
//   // Group logs by time intervals
//   const timeGroups = this.groupLogsByTimeInterval(logs);
//   const timeLabels = Object.keys(timeGroups).slice(0, 7); // Show 7 time points
  
//   // Calculate counts for each log type at each time point
//   const errorCounts: number[] = [];
//   const warnCounts: number[] = [];
//   const infoCounts: number[] = [];
//   const debugCounts: number[] = [];
  
//   timeLabels.forEach((time) => {
//     const group = timeGroups[time] || [];
//     errorCounts.push(group.filter((l: any) => l.log_level === 'ERROR').length);
//     warnCounts.push(group.filter((l: any) => l.log_level === 'WARN').length);
//     infoCounts.push(group.filter((l: any) => l.log_level === 'INFO').length);
//     debugCounts.push(group.filter((l: any) => l.log_level === 'DEBUG').length);
//   });
  
//   return {
//     // VERTICAL GROUPED BAR CHART DATA
//     trendData: {
//       labels: timeLabels,
//       datasets: [
//         {
//           label: 'Errors',
//           data: errorCounts,
//           backgroundColor: 'rgba(255, 59, 48, 0.7)',
//           borderColor: '#ff3b30',
//           borderWidth: 2,
//           borderRadius: 4,
//           barPercentage: 0.8,
//           categoryPercentage: 0.9
//         },
//         {
//           label: 'Warnings',
//           data: warnCounts,
//           backgroundColor: 'rgba(255, 204, 0, 0.7)',
//           borderColor: '#ffcc00',
//           borderWidth: 2,
//           borderRadius: 4,
//           barPercentage: 0.8,
//           categoryPercentage: 0.9
//         },
//         {
//           label: 'Info',
//           data: infoCounts,
//           backgroundColor: 'rgba(0, 122, 255, 0.7)',
//           borderColor: '#007aff',
//           borderWidth: 2,
//           borderRadius: 4,
//           barPercentage: 0.8,
//           categoryPercentage: 0.9
//         },
//         {
//           label: 'Debug',
//           data: debugCounts,
//           backgroundColor: 'rgba(175, 82, 222, 0.7)',
//           borderColor: '#af52de',
//           borderWidth: 2,
//           borderRadius: 4,
//           barPercentage: 0.8,
//           categoryPercentage: 0.9
//         }
//       ]
//     } as ChartData<'bar'>,
    
//     // Distribution chart remains the same
//     distributionData: {
//       labels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
//       datasets: [{
//         label: 'Distribution',
//         data: [
//           this.totalErrors(),
//           this.totalWarnings(),
//           this.totalInfo(),
//           this.totalDebug()
//         ],
//         backgroundColor: [
//           'rgba(255, 59, 48, 0.7)',
//           'rgba(255, 204, 0, 0.7)',
//           'rgba(0, 122, 255, 0.7)',
//           'rgba(175, 82, 222, 0.7)'
//         ],
//         borderColor: [
//           '#ff3b30',
//           '#ffcc00',
//           '#007aff',
//           '#af52de'
//         ],
//         borderWidth: 2,
//         hoverOffset: 4
//       }]
//     } as ChartData<'doughnut'>
//   };
// }
getChartData(): { trendData: ChartData; distributionData: ChartData } {
  const logs = this.errorLogs();
  
  // Group logs by time intervals
  const timeGroups = this.groupLogsByTimeInterval(logs);
  const timeLabels = Object.keys(timeGroups).slice(0, 7);
  
  // Calculate counts for each log type
  const errorCounts: number[] = [];
  const warnCounts: number[] = [];
  const infoCounts: number[] = [];
  const debugCounts: number[] = [];
  
  timeLabels.forEach((time) => {
    const group = timeGroups[time] || [];
    errorCounts.push(group.filter((l: any) => l.log_level === 'ERROR').length);
    warnCounts.push(group.filter((l: any) => l.log_level === 'WARN').length);
    infoCounts.push(group.filter((l: any) => l.log_level === 'INFO').length);
    debugCounts.push(group.filter((l: any) => l.log_level === 'DEBUG').length);
  });
  
  return {
    trendData: {
      labels: timeLabels,
      datasets: [
        {
          label: 'Errors',
          data: errorCounts,
          backgroundColor: 'rgba(255, 59, 48, 0.7)',
          borderColor: '#ff3b30',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.4,        // REDUCED from 0.8 to 0.4 (makes bars 50% thinner)
          categoryPercentage: 0.6,    // REDUCED from 0.9 to 0.6 (adds more space between groups)
          maxBarThickness: 30         // Maximum bar width in pixels
        },
        {
          label: 'Warnings',
          data: warnCounts,
          backgroundColor: 'rgba(255, 204, 0, 0.7)',
          borderColor: '#ffcc00',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.4,        // REDUCED
          categoryPercentage: 0.6,    // REDUCED
          maxBarThickness: 30
        },
        {
          label: 'Info',
          data: infoCounts,
          backgroundColor: 'rgba(0, 122, 255, 0.7)',
          borderColor: '#007aff',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.4,        // REDUCED
          categoryPercentage: 0.6,    // REDUCED
          maxBarThickness: 30
        },
        {
          label: 'Debug',
          data: debugCounts,
          backgroundColor: 'rgba(175, 82, 222, 0.7)',
          borderColor: '#af52de',
          borderWidth: 2,
          borderRadius: 4,
          barPercentage: 0.4,        // REDUCED
          categoryPercentage: 0.6,    // REDUCED
          maxBarThickness: 30
        }
      ]
    } as ChartData<'bar'>,
    
    // Distribution chart remains unchanged
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
        ],
        borderColor: [
          '#ff3b30',
          '#ffcc00',
          '#007aff',
          '#af52de'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }]
    } as ChartData<'doughnut'>
  };
}
  private groupLogsByTimeInterval(logs: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    
    logs.forEach(log => {
      // Group by seconds (you can adjust the grouping logic)
      const timeKey = log.time ? log.time.substring(0, 8) : 'unknown'; // HH:MM:SS
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      grouped[timeKey].push(log);
    });
    
    // If no logs, create sample time points
    if (Object.keys(grouped).length === 0) {
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const time = new Date(now.getTime() - i * 60000); // Go back in 1-minute intervals
        const timeKey = time.toTimeString().substring(0, 8);
        grouped[timeKey] = [];
      }
    }
    
    // Sort by time and return
    return Object.keys(grouped)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});
  }

  private checkForNewErrors(logs: ErrorLog[]): void {
    const newErrors = logs.filter(log => log.log_level === 'ERROR').length;
    const previousErrors = this.previousLogs().filter(log => log.log_level === 'ERROR').length;
    
    if (newErrors > previousErrors && this.previousLogs().length > 0) {
      this.newErrorCount.next(newErrors - previousErrors);
    }
  }

  getNewErrorCount(): Observable<number> {
    return this.newErrorCount.asObservable();
  }

  refreshData(): void {
    if (this.errorLogs().length > 0) {
      this.lastUpdateTime.set(new Date());
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh$.next(!this.autoRefresh$.value);
  }

  isAutoRefreshEnabled(): boolean {
    return this.autoRefresh$.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newErrorCount.complete();
    this.autoRefresh$.complete();
  }
}