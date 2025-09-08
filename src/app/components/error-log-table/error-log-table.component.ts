import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorLog } from '../../models/error-log.model';

@Component({
  selector: 'app-error-log-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="log-container">
      <div class="log-header">
        <div class="log-title">Recent System Logs</div>
        <div class="log-count">{{ errorLogs.length }} logs</div>
      </div>
      <div class="table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Level</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of errorLogs; let i = index" 
                [@tableRow]="'in'"
                [class.error-row]="log.log_level === 'ERROR'">
              <td>{{ log.date }}</td>
              <td class="time-cell">{{ log.time }}</td>
              <td>
                <span class="log-level" [ngClass]="getLogLevelClass(log.log_level)">
                  {{ log.log_level }}
                </span>
              </td>
              <td class="message-cell" [title]="log.message">{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
        <div class="no-data" *ngIf="errorLogs.length === 0 && !loading">
          <span class="no-data-icon">📊</span>
          <p>No logs available</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./error-log-table.component.scss'],
  animations: [
    // Add animations if needed
  ]
})
export class ErrorLogTableComponent {
  @Input() errorLogs: ErrorLog[] = [];
  @Input() loading: boolean = false;

  getLogLevelClass(logLevel: string): string {
    return logLevel.toLowerCase();
  }
}