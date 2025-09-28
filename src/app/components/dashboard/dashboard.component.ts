import { Component, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { ErrorChartComponent } from '../error-chart/error-chart.component';
import { ErrorLogTableComponent } from '../error-log-table/error-log-table.component';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { ErrorDataService } from '../../services/error-data.service';
import { ThemeService } from '../../services/theme.service';

import { StatCard } from '../../models/stats.model';
import { ErrorLog } from '../../models/error-log.model';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatsCardComponent,
    ErrorChartComponent,
    ErrorLogTableComponent,
    FileUploadComponent,
    ThemeToggleComponent
  ],
  template: `
    <div class="dashboard-wrapper">
      <!-- Loading bar animation -->
      <div class="loading-bar" *ngIf="loading()"></div>
       <!-- Theme Toggle Button (Fixed Position) -->
      <div class="theme-toggle-fixed">
        <app-theme-toggle></app-theme-toggle>
      </div>
      
      <div class="dashboard-container">
        <!-- Header Section -->
        <app-header></app-header>

        <!-- File Upload Section -->
        <app-file-upload (logsUploaded)="onLogsUploaded()"></app-file-upload>

        <!-- Error Message -->
        <!-- <app-error-message 
          *ngIf="error()" 
          [message]="error()!"
          (retry)="onRetry()">
        </app-error-message> -->

        <!-- Auto-refresh Toggle (show only when logs are loaded) -->
        <div class="controls-bar" *ngIf="errorLogs.length > 0">
          <div class="auto-refresh-toggle">
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                [checked]="isAutoRefreshEnabled"
                (change)="toggleAutoRefresh()">
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Auto-refresh</span>
          </div>
          
          <div class="last-update" *ngIf="lastUpdateTime()">
            Last updated: {{ formatLastUpdate() }}
          </div>
        </div>

        <!-- No Data Message -->
        <div class="no-data-message" *ngIf="!loading() && errorLogs.length === 0">
          <div class="no-data-icon">📊</div>
          <h3>No Log Data Available</h3>
          <p>Upload a log file to start monitoring system errors and performance</p>
        </div>

        <!-- Main Content (show only when logs are loaded) -->
        <div *ngIf="errorLogs.length > 0" class="content-wrapper">
          <!-- Stats Grid -->
          <div class="stats-grid">
            <app-stats-card 
              *ngFor="let stat of stats"
              [stat]="stat">
            </app-stats-card>
          </div>

          <!-- Charts Grid -->
          <div class="charts-grid">
      <!-- Stacked Line Chart -->
      <app-error-chart
        title="Error Trend Analysis - Stacked View"
        chartType="bar"
        [chartData]="trendChartData"
        [isStacked]="true">
      </app-error-chart>
      
      <!-- Distribution Doughnut Chart -->
      <app-error-chart
        title="Error Type Distribution"
        chartType="doughnut"
        [chartData]="distributionChartData">
      </app-error-chart>
    </div>

          <!-- Error Log Table -->
          <app-error-log-table 
            [errorLogs]="errorLogs"
            [loading]="loading()">
          </app-error-log-table>
        </div>
      </div>

      <!-- Floating Action Button (show only when logs are loaded) -->
      <div class="fab" 
           *ngIf="errorLogs.length > 0"
           (click)="refreshData()" 
           [class.spinning]="loading()">
        <span class="fab-icon">↻</span>
        <div class="notification-badge" *ngIf="newErrors > 0">
          {{ newErrors }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: StatCard[] = [];
  errorLogs: ErrorLog[] = [];
  trendChartData: any = null;
  distributionChartData: any = null;
  newErrors = 0;
  isAutoRefreshEnabled = true;

  // Expose service signals to template
  loading = this.errorDataService.loading;
  error = this.errorDataService.error;
  lastUpdateTime = this.errorDataService.lastUpdateTime;

  constructor(private errorDataService: ErrorDataService) {
    // React to changes in error logs
    effect(() => {
      this.errorLogs = this.errorDataService.getErrorLogs();
      if (this.errorLogs.length > 0) {
        this.updateDashboard();
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToUpdates();
    this.isAutoRefreshEnabled = this.errorDataService.isAutoRefreshEnabled();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogsUploaded(): void {
    // Refresh dashboard after logs are uploaded
    this.updateDashboard();
  }

  private updateDashboard(): void {
    // Update stats
    this.stats = this.errorDataService.getStats();
    
    // Update chart data
    const chartData = this.errorDataService.getChartData();
    this.trendChartData = chartData.trendData;
    this.distributionChartData = chartData.distributionData;
  }

  private subscribeToUpdates(): void {
    // Subscribe to new error notifications
    this.errorDataService.getNewErrorCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.newErrors = count;
      });
  }

  refreshData(): void {
    this.errorDataService.refreshData();
    this.updateDashboard();
    this.newErrors = 0;
  }

  onRetry(): void {
    this.errorDataService.error.set(null);
    this.updateDashboard();
  }

  toggleAutoRefresh(): void {
    this.errorDataService.toggleAutoRefresh();
    this.isAutoRefreshEnabled = this.errorDataService.isAutoRefreshEnabled();
  }

  formatLastUpdate(): string {
    const time = this.lastUpdateTime();
    if (!time) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}