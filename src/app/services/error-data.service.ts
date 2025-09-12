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
import { N8NApiResponse } from '../models/n8n-response.model';
import { ChartData } from 'chart.js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ErrorDataService {
  private readonly apiUrl = environment.n8nWebhookUrl;
  private readonly refreshInterval = environment.refreshInterval;
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
  
  // Computed signals remain the same...
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
    // Initialize with empty data
    this.initializeEmptyState();
    
    // Set up auto-refresh if enabled
    if (environment.enableRealTimeUpdates) {
      this.setupAutoRefresh();
    }
  }

  private initializeEmptyState(): void {
    // Start with empty state, waiting for file upload
    this.errorLogs.set([]);
    this.lastUpdateTime.set(null);
  }

  private setupAutoRefresh(): void {
    // Auto-refresh logic remains the same
    this.autoRefresh$
      .pipe(
        switchMap(shouldRefresh => 
          shouldRefresh ? timer(this.refreshInterval, this.refreshInterval) : of(null)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.autoRefresh$.value && this.errorLogs().length > 0) {
          // Only refresh if we have data
          this.refreshData();
        }
      });
  }
    getNewErrorCount(): Observable<number> {
    return this.newErrorCount.asObservable();
  }

  /**
   * Process logs from file upload
   */
  processUploadedLogs(responseData: any): void {
    // Parse the response based on N8N webhook response format
    if (responseData && Array.isArray(responseData)) {
      const parsedLogs = this.parseLogData(responseData);
      
      // Store previous logs for trend calculation
      this.previousLogs.set(this.errorLogs());
      
      // Update signals with new data
      this.errorLogs.set(parsedLogs);
      this.lastUpdateTime.set(new Date());
      
      // Check for new errors
      this.checkForNewErrors(parsedLogs);
    }
  }

  /**
   * Parse log data from N8N response
   */
  private parseLogData(data: any[]): ErrorLog[] {
    return data.map((item, index) => ({
      id: index + 1,
      date: item.date,
      time: item.time,
      log_level: item.log_level as 'ERROR' | 'WARN' | 'INFO' | 'DEBUG',
      message: item.message
    }));
  }

  /**
   * Parse raw log file content (for direct text parsing if needed)
   */
  parseRawLogContent(content: string): ErrorLog[] {
    const lines = content.split('\n').filter(line => line.trim());
    const logs: ErrorLog[] = [];
    
    lines.forEach((line, index) => {
      // Parse Java log format: 2025-08-21 14:01:33,511 [thread] LEVEL package - message
      const logPattern = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2},\d{3})\s+\[([^\]]+)\]\s+(DEBUG|INFO|WARN|ERROR)\s+(.+)$/;
      const match = line.match(logPattern);
      
      if (match) {
        logs.push({
          id: index + 1,
          date: match[1],
          time: match[2],
          log_level: match[4] as 'ERROR' | 'WARN' | 'INFO' | 'DEBUG',
          message: match[5]
        });
      }
    });
    
    return logs;
  }

  /**
   * Upload log file content to N8N
   */
  uploadLogContent(content: string): Observable<any> {
    this.loading.set(true);
    this.error.set(null);

    const headers = new HttpHeaders({
      'Content-Type': 'text/plain',
      'Accept': '*/*'
    });

    return this.http.post(this.apiUrl, content, { headers })
      .pipe(
        map(response => {
          this.loading.set(false);
          return response;
        }),
        catchError(this.handleError.bind(this)),
        finalize(() => this.loading.set(false))
      );
  }

  // Other methods remain the same...
  getErrorLogs(): ErrorLog[] {
    return this.errorLogs();
  }

  getStats(): StatCard[] {
    const systemHealthValue = this.systemHealth();
    
    return [
      {
        label: 'Total Errors',
        value: this.totalErrors(),
        trend: this.errorLogs().length > 0 ? 'Monitoring active' : 'Upload file to start',
        trendDirection: this.totalErrors() > 0 ? 'down' : 'neutral'
      },
      {
        label: 'Warnings',
        value: this.totalWarnings(),
        trend: this.errorLogs().length > 0 ? 'System warnings' : 'No data',
        trendDirection: this.totalWarnings() > 0 ? 'down' : 'neutral'
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

  getChartData(): { trendData: ChartData; distributionData: ChartData } {
    // Group logs by time for trend chart
    const timeGroups = this.groupLogsByTime();
    
    return {
      trendData: {
        labels: Object.keys(timeGroups).slice(0, 7), // Show last 7 time points
        datasets: [
          {
            label: 'Errors',
            data: Object.values(timeGroups).slice(0, 7).map(logs => 
              logs.filter(l => l.log_level === 'ERROR').length
            ),
            borderColor: '#ff3b30',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Warnings',
            data: Object.values(timeGroups).slice(0, 7).map(logs => 
              logs.filter(l => l.log_level === 'WARN').length
            ),
            borderColor: '#ffcc00',
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Info',
            data: Object.values(timeGroups).slice(0, 7).map(logs => 
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

  private groupLogsByTime(): { [time: string]: ErrorLog[] } {
    const grouped: { [time: string]: ErrorLog[] } = {};
    
    this.errorLogs().forEach(log => {
      const timeKey = log.time.substring(0, 8); // Group by HH:MM:SS
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      grouped[timeKey].push(log);
    });
    
    return grouped;
  }

  private checkForNewErrors(logs: ErrorLog[]): void {
    const newErrors = logs.filter(log => log.log_level === 'ERROR').length;
    const previousErrors = this.previousLogs().filter(log => log.log_level === 'ERROR').length;
    
    if (newErrors > previousErrors && this.previousLogs().length > 0) {
      this.newErrorCount.next(newErrors - previousErrors);
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while uploading the file';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to N8N webhook. Please check CORS settings.';
          break;
        case 400:
          errorMessage = 'Invalid file format or content.';
          break;
        case 413:
          errorMessage = 'File is too large. Please upload a smaller file.';
          break;
        case 500:
          errorMessage = 'N8N webhook error. Please check your workflow.';
          break;
        default:
          errorMessage = `Upload error: ${error.status} - ${error.message}`;
      }
    }
    
    this.error.set(errorMessage);
    console.error('Upload Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  refreshData(): void {
    // Refresh only if we have data
    if (this.errorLogs().length > 0) {
      // Re-process current logs or fetch new ones
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