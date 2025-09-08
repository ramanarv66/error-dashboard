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
import { N8NApiResponse } from '../models/n8n-response.model';
import { StatCard } from '../models/stats.model';
import { ChartData } from 'chart.js';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ErrorDataService {


//  // Using Angular 19 signals for reactive state management
//   private errorLogs = signal<ErrorLog[]>([
//     { id: 1, errorType: 'DEBUG', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 2, errorType: 'INFO', message: 'com.example.co', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 3, errorType: 'ERROR', message: 'com.example.Ma', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 4, errorType: 'DEBUG', message: 'com.example.da', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 5, errorType: 'INFO', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 6, errorType: 'DEBUG', message: 'com.example.se', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 7, errorType: 'WARN', message: 'com.example.da', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 8, errorType: 'INFO', message: 'com.example.uti', date: '2025-08-21', time: '14:01:33.511' },
//     { id: 9, errorType: 'ERROR', message: 'com.example.se', date: '2025-08-21', time: '14:01:33.511' }
//   ]);

//   private newErrorCount = new BehaviorSubject<number>(0);
  
//   // Computed signals for reactive calculations
//   readonly totalErrors = computed(() => 
//     this.errorLogs().filter(log => log.errorType === 'ERROR').length
//   );
  
//   readonly totalWarnings = computed(() => 
//     this.errorLogs().filter(log => log.errorType === 'WARN').length
//   );
  
//   readonly totalInfo = computed(() => 
//     this.errorLogs().filter(log => log.errorType === 'INFO').length
//   );
  
//   readonly totalDebug = computed(() => 
//     this.errorLogs().filter(log => log.errorType === 'DEBUG').length
//   );
  
//   readonly systemHealth = computed(() => {
//     const total = this.errorLogs().length;
//     const errors = this.totalErrors();
//     return total > 0 ? Math.round((1 - errors / total) * 100) : 100;
//   });

//   constructor() {
//     // Simulate real-time error updates
//     this.startRealTimeSimulation();
//   }

//   getErrorLogs(): ErrorLog[] {
//     return this.errorLogs();
//   }

//   getStats(): StatCard[] {
//     return [
//       {
//         label: 'Total Errors',
//         value: this.totalErrors(),
//         trend: '↑ 12% from last hour',
//         trendDirection: 'up'
//       },
//       {
//         label: 'Warnings',
//         value: this.totalWarnings(),
//         trend: '↓ 5% from last hour',
//         trendDirection: 'down'
//       },
//       {
//         label: 'Total Logs',
//         value: this.errorLogs().length,
//         trend: 'Real-time monitoring',
//         trendDirection: 'neutral'
//       },
//       {
//         label: 'System Health',
//         value: `${this.systemHealth()}%`,
//         trend: 'Optimal performance',
//         trendDirection: this.systemHealth() > 80 ? 'up' : 'down'
//       }
//     ];
//   }

//   getChartData(): { trendData: ChartData; distributionData: ChartData } {
//     return {
//       trendData: {
//         labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
//         datasets: [
//           {
//             label: 'Errors',
//             data: [3, 5, 2, 8, 4, 6, 2],
//             borderColor: '#ff3b30',
//             backgroundColor: 'rgba(255, 59, 48, 0.1)',
//             tension: 0.4,
//             fill: true
//           },
//           {
//             label: 'Warnings',
//             data: [1, 3, 4, 2, 5, 3, 1],
//             borderColor: '#ffcc00',
//             backgroundColor: 'rgba(255, 204, 0, 0.1)',
//             tension: 0.4,
//             fill: true
//           },
//           {
//             label: 'Info',
//             data: [10, 15, 12, 18, 14, 16, 13],
//             borderColor: '#007aff',
//             backgroundColor: 'rgba(0, 122, 255, 0.1)',
//             tension: 0.4,
//             fill: true
//           }
//         ]
//       },
//       distributionData: {
//         labels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
//         datasets: [{
//           label: 'Distribution',
//           data: [
//             this.totalErrors(),
//             this.totalWarnings(),
//             this.totalInfo(),
//             this.totalDebug()
//           ],
//           backgroundColor: [
//             'rgba(255, 59, 48, 0.7)',
//             'rgba(255, 204, 0, 0.7)',
//             'rgba(0, 122, 255, 0.7)',
//             'rgba(175, 82, 222, 0.7)'
//           ]
//         }]
//       }
//     };
//   }

//   getNewErrorCount(): Observable<number> {
//     return this.newErrorCount.asObservable();
//   }

//   refreshData(): void {
//     this.newErrorCount.next(0);
//     // Simulate data refresh
//     console.log('Data refreshed');
//   }

//   private startRealTimeSimulation(): void {
//     interval(5000).subscribe(() => {
//       if (Math.random() > 0.7) {
//         const count = Math.floor(Math.random() * 5) + 1;
//         this.newErrorCount.next(count);
//       }
//     });
//   }

 private readonly apiUrl = environment.n8nWebhookUrl;
  private readonly refreshInterval = environment.refreshInterval;
  private destroy$ = new Subject<void>();
  private loginIdSubject$ = new Subject<void>();
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

  // Computed trend calculations
  readonly errorTrend = computed(() => {
    const current = this.totalErrors();
    const previous = this.previousLogs().filter(log => log.log_level === 'ERROR').length;
    return this.calculateTrendPercentage(current, previous);
  });

  readonly warningTrend = computed(() => {
    const current = this.totalWarnings();
    const previous = this.previousLogs().filter(log => log.log_level === 'WARN').length;
    return this.calculateTrendPercentage(current, previous);
  });

  constructor() {
    // Initialize data on service creation
    this.initializeData();
    
    // Set up auto-refresh if enabled
    if (environment.enableRealTimeUpdates) {
      this.setupAutoRefresh();
    }
  }

  // ============================================
  // INITIALIZATION METHODS
  // ============================================
  
  private initializeData(): void {
    this.fetchErrorLogs().subscribe();
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
        if (this.autoRefresh$.value) {
          this.refreshData();
        }
      });
  }

  // ============================================
  // API METHODS
  // ============================================

  /**
   * Fetch error logs from N8N webhook
   */
  fetchErrorLogs(payload?: any): Observable<ErrorLog[]> {
    this.loading.set(true);
    this.error.set(null);

    // Default payload if not provided
    const requestPayload = payload || {
      action: 'fetch_logs',
      timestamp: new Date().toISOString()
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<N8NApiResponse>(
      this.apiUrl,
      requestPayload,
      { headers }
    ).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(response => {
        // Add IDs to logs if not present
        const logsWithIds = response.data.map((log, index) => ({
          ...log,
          id: log.id || index + 1
        }));
        
        // Store previous logs for trend calculation
        this.previousLogs.set(this.errorLogs());
        
        // Update signals with new data
        this.errorLogs.set(logsWithIds);
        this.lastUpdateTime.set(new Date());
        
        // Check for new errors
        this.checkForNewErrors(logsWithIds);
        
        return logsWithIds;
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loading.set(false)),
      shareReplay(1) // Share the result among multiple subscribers
    );
  }

  /**
   * Upload log file to N8N webhook
   */
  uploadLogFile(file: File): Observable<ErrorLog[]> {
    this.loading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'upload_file');

    // return this.http.post<N8NApiResponse>(
    //   this.apiUrl,
    //   formData
    // ).pipe(
    //   retry(1),
    //   map(response => {
    //     const logsWithIds = response.data.map((log, index) => ({
    //       ...log,
    //       id: log.id || index + 1
    //     }));
        
    //     this.errorLogs.set(logsWithIds);
    //     this.lastUpdateTime.set(new Date());
        
    //     return logsWithIds;
    //   }),
    //   catchError(this.handleError.bind(this)),
    //   finalize(() => this.loading.set(false))
    // );
     let logsWithIds = this.sendLogFromAssets();
     this.loginIdSubject$.subscribe((ids)=>{
      return ids;
     })
     if(logsWithIds)
        return logsWithIds;
      else
         return logsWithIds;
      
  }

  /**
   * Filter logs by date range
   */
  filterLogs(startDate?: string, endDate?: string, logLevel?: string): Observable<ErrorLog[]> {
    const payload = {
      action: 'filter_logs',
      filters: {
        startDate,
        endDate,
        logLevel
      }
    };

    return this.fetchErrorLogs(payload);
  }

  // ============================================
  // PUBLIC METHODS (Used by components)
  // ============================================

  getErrorLogs(): ErrorLog[] {
    return this.errorLogs();
  }

  getStats(): StatCard[] {
    const errorTrendInfo = this.errorTrend();
    const warningTrendInfo = this.warningTrend();
    const systemHealthValue = this.systemHealth();
    
    return [
      {
        label: 'Total Errors',
        value: this.totalErrors(),
        trend: `${errorTrendInfo.direction === 'up' ? '↑' : '↓'} ${Math.abs(errorTrendInfo.percentage)}% from last update`,
        trendDirection: errorTrendInfo.direction
      },
      {
        label: 'Warnings',
        value: this.totalWarnings(),
        trend: `${warningTrendInfo.direction === 'up' ? '↑' : '↓'} ${Math.abs(warningTrendInfo.percentage)}% from last update`,
        trendDirection: warningTrendInfo.direction
      },
      {
        label: 'Total Logs',
        value: this.errorLogs().length,
        trend: 'Real-time monitoring',
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

  getChartData(): { trendData: ChartData; distributionData: ChartData } {
    // Group logs by hour for trend chart
    const hourlyData = this.groupLogsByHour();
    
    return {
      trendData: {
        labels: Object.keys(hourlyData),
        datasets: [
          {
            label: 'Errors',
            data: Object.values(hourlyData).map(logs => 
              logs.filter(l => l.log_level === 'ERROR').length
            ),
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Warnings',
            data: Object.values(hourlyData).map(logs => 
              logs.filter(l => l.log_level === 'WARN').length
            ),
            borderColor: '#ffcc00',
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Info',
            data: Object.values(hourlyData).map(logs => 
              logs.filter(l => l.log_level === 'INFO').length
            ),
            borderColor: '#007aff',
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      } as ChartData,
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
          borderWidth: 2
        }]
      } as ChartData
    };
  }

  getNewErrorCount(): Observable<number> {
    return this.newErrorCount.asObservable();
  }

  refreshData(): void {
    this.fetchErrorLogs().subscribe();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh$.next(!this.autoRefresh$.value);
  }

  isAutoRefreshEnabled(): boolean {
    return this.autoRefresh$.value;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private groupLogsByHour(): { [hour: string]: ErrorLog[] } {
    const grouped: { [hour: string]: ErrorLog[] } = {};
    
    this.errorLogs().forEach(log => {
      const hour = log.time.split(':')[0] + ':00';
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(log);
    });
    
    // Ensure we have at least some hours for the chart
    if (Object.keys(grouped).length === 0) {
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const hour = `${String((now.getHours() - i + 24) % 24).padStart(2, '0')}:00`;
        grouped[hour] = [];
      }
    }
    
    return grouped;
  }

  private checkForNewErrors(logs: ErrorLog[]): void {
    const newErrors = logs.filter(log => log.log_level === 'ERROR').length;
    const previousErrors = this.previousLogs().filter(log => log.log_level === 'ERROR').length;
    
    if (newErrors > previousErrors) {
      this.newErrorCount.next(newErrors - previousErrors);
    }
  }

  private calculateTrendPercentage(current: number, previous: number): { percentage: number; direction: 'up' | 'down' | 'neutral' } {
    if (previous === 0 && current === 0) {
      return { percentage: 0, direction: 'neutral' };
    }
    
    if (previous === 0) {
      return { percentage: 100, direction: 'up' };
    }
    
    const percentage = Math.round(((current - previous) / previous) * 100);
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    
    return { percentage, direction };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching logs';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication failed. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'The webhook endpoint was not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }
    
    this.error.set(errorMessage);
    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // CLEANUP
  // ============================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newErrorCount.complete();
    this.autoRefresh$.complete();
  }

  webhookUrl = 'https://ramana-ai-1.app.n8n.cloud/webhook-test/upload-log-file';
  fileContent: string = '';
  requestPayload: any = null;
  response: any = null;
  error1: any = null;
   logsWithIds: any;
   sendLogFromAssets() {
    console.log('Sending as plain text...');
    this.error1 = null;
    this.response = null;
    
    // Read file from assets
    this.http.get('assets/java_application.log', { responseType: 'text' })
      .subscribe(
        content => {
          // Send ONLY the content as plain text (not wrapped in JSON)
          const headers = new HttpHeaders({
            'Content-Type': 'text/plain'  // Important: Set as text/plain
          });
          
          // Send raw content directly
          this.http.post(this.webhookUrl, content, { headers, responseType: 'text' })
            .subscribe(
              res => {
                console.log('Success:', res);
                let somData:any = res;
                     this.logsWithIds = JSON.parse(somData).data.map((log:any, index:any) => ({
          ...log,
          id: log.id || index + 1
        }));
        
        this.errorLogs.set(this.logsWithIds);
        this.lastUpdateTime.set(new Date());
        this.loginIdSubject$.next(this.logsWithIds)
        return this.logsWithIds;
                this.response = res || 'File sent successfully (no response body)';
              },
              err => {
                console.error('Error:', err);
                this.error1 = err.message;
              }
            );
        },
        fileError => {
          this.error1 = 'Failed to read file: ' + fileError.message;
        }
      );
       //     this.errorLogs.set(logsWithIds);
    //     this.lastUpdateTime.set(new Date());
        
         return this.logsWithIds;
  }
}
