import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorLog } from '../../models/error-log.model';

@Component({
  selector: 'app-error-log-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="log-container">
      <div class="log-title">Recent System Logs</div>
      <div class="table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Message</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of errorLogs" 
                [@tableRow]="'in'"
                [class.error-row]="log.errorType === 'ERROR'">
              <td class="id-cell">#{{ log.id }}</td>
              <td>
                <span class="error-type" [ngClass]="getErrorClass(log.errorType)">
                  {{ log.errorType }}
                </span>
              </td>
              <td class="message-cell">{{ log.message }}</td>
              <td>{{ log.date }}</td>
              <td>{{ log.time }}</td>
            </tr>
          </tbody>
        </table>
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

  getErrorClass(errorType: string): string {
    return errorType.toLowerCase();
  }
}