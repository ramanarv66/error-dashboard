import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { ErrorChartComponent } from '../error-chart/error-chart.component';
import { ErrorLogTableComponent } from '../error-log-table/error-log-table.component';
import { ErrorDataService } from '../../services/error-data.service';
import { StatCard } from '../../models/stats.model';
import { ErrorLog } from '../../models/error-log.model';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StatsCardComponent,
    ErrorChartComponent,
    ErrorLogTableComponent,
    FileUploadComponent
  ],
  template: `
    <div class="dashboard-wrapper">
      <!-- Loading bar animation -->
      <div class="loading-bar"></div>
      
      <div class="dashboard-container">
        <!-- Header Section -->
        <app-header></app-header>
        <app-file-upload></app-file-upload>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <app-stats-card 
            *ngFor="let stat of stats"
            [stat]="stat">
          </app-stats-card>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <app-error-chart
            title="Error Trend Analysis"
            chartType="line"
            [chartData]="trendChartData">
          </app-error-chart>
          
          <app-error-chart
            title="Error Type Distribution"
            chartType="doughnut"
            [chartData]="distributionChartData">
          </app-error-chart>
        </div>

        <!-- Error Log Table -->
        <app-error-log-table [errorLogs]="errorLogs"></app-error-log-table>
      </div>

      <!-- Floating Action Button -->
      <div class="fab" (click)="refreshData()">
        <span class="fab-icon">↻</span>
        <div class="notification-badge" *ngIf="newErrors > 0">
          {{ newErrors }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  errorLogs: ErrorLog[] = [];
  trendChartData: any;
  distributionChartData: any;
  newErrors: number = 0;

  constructor(private errorDataService: ErrorDataService) {}

  ngOnInit(): void {
    this.loadData();
    this.subscribeToUpdates();
  }

  private loadData(): void {
    // Load stats
    this.stats = this.errorDataService.getStats();
    
    // Load error logs
    this.errorLogs = this.errorDataService.getErrorLogs();
    
    // Load chart data
    const chartData = this.errorDataService.getChartData();
    this.trendChartData = chartData.trendData;
    this.distributionChartData = chartData.distributionData;
  }

  private subscribeToUpdates(): void {
    this.errorDataService.getNewErrorCount().subscribe(count => {
      this.newErrors = count;
    });
  }

  refreshData(): void {
    this.errorDataService.refreshData();
    this.loadData();
    this.newErrors = 0;
  }
}