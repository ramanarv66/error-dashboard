import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ErrorDataService } from '../../services/error-data.service';
import { environment } from '../../../environments/environment';
import { catchError, of, timeout } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <input 
        type="file" 
        #fileInput
        (change)="onFileSelected($event)"
        accept=".log,.txt"
        style="display: none">
      
      <button 
        class="upload-button" 
        (click)="fileInput.click()"
        [disabled]="uploading">
        <span class="upload-icon">{{ uploading ? '⏳' : '📁' }}</span>
        {{ uploading ? 'Processing...' : 'Upload Log File' }}
      </button>
      
      <div class="file-info" *ngIf="selectedFile">
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
      </div>

      <div class="upload-status" *ngIf="uploadStatus">
        <span [class]="'status-' + uploadStatus.type">
          {{ uploadStatus.message }}
        </span>
      </div>

      <div class="log-summary" *ngIf="logSummary">
        <div class="summary-title">Upload Summary</div>
        <div class="summary-stats">
          <span class="stat-item error">Errors: {{ logSummary.errors }}</span>
          <span class="stat-item warn">Warnings: {{ logSummary.warnings }}</span>
          <span class="stat-item info">Info: {{ logSummary.info }}</span>
          <span class="stat-item debug">Debug: {{ logSummary.debug }}</span>
          <span class="stat-item total">Total: {{ logSummary.total }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(57, 255, 20, 0.2);
      border-radius: 15px;
      margin-bottom: 2rem;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(57, 255, 20, 0.3);
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.1);
      }
    }

    .upload-button {
      background: linear-gradient(135deg, #39ff14, rgba(57, 255, 20, 0.7));
      color: #0a0e27;
      border: none;
      border-radius: 25px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      align-self: flex-start;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(57, 255, 20, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.7; }
    }

    .upload-icon {
      font-size: 1.2rem;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      background: rgba(57, 255, 20, 0.05);
      border-radius: 10px;
      border: 1px solid rgba(57, 255, 20, 0.2);
    }

    .file-name {
      color: #39ff14;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .file-size {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.8rem;
    }

    .upload-status {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .status-success {
      color: #39ff14;
      display: block;
      padding: 0.75rem;
      background: rgba(57, 255, 20, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(57, 255, 20, 0.3);
      font-weight: 500;
    }

    .status-error {
      color: #ff3b30;
      display: block;
      padding: 0.75rem;
      background: rgba(255, 59, 48, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(255, 59, 48, 0.3);
      font-weight: 500;
    }

    .log-summary {
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(57, 255, 20, 0.05);
      border-radius: 10px;
      border: 1px solid rgba(57, 255, 20, 0.2);
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .summary-title {
      color: #39ff14;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.75rem;
    }

    .summary-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stat-item {
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: 600;

      &.error {
        background: rgba(255, 59, 48, 0.2);
        color: #ff3b30;
        border: 1px solid rgba(255, 59, 48, 0.3);
      }

      &.warn {
        background: rgba(255, 204, 0, 0.2);
        color: #ffcc00;
        border: 1px solid rgba(255, 204, 0, 0.3);
      }

      &.info {
        background: rgba(0, 122, 255, 0.2);
        color: #007aff;
        border: 1px solid rgba(0, 122, 255, 0.3);
      }

      &.debug {
        background: rgba(175, 82, 222, 0.2);
        color: #af52de;
        border: 1px solid rgba(175, 82, 222, 0.3);
      }

      &.total {
        background: rgba(57, 255, 20, 0.2);
        color: #39ff14;
        border: 1px solid rgba(57, 255, 20, 0.3);
      }
    }
  `]
})
export class FileUploadComponent {
  private http = inject(HttpClient);
  private errorDataService = inject(ErrorDataService);
  
  @Output() logsUploaded = new EventEmitter<void>();
  
  selectedFile: File | null = null;
  uploading = false;
  uploadStatus: { type: 'success' | 'error', message: string } | null = null;
  logSummary: {
    errors: number;
    warnings: number;
    info: number;
    debug: number;
    total: number;
  } | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadStatus = null;
      this.logSummary = null;
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    
    this.uploading = true;
    this.uploadStatus = null;

    // Read file content as text
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      const fileContent = e.target.result as string;
      
      // Send the plain text content to N8N webhook
      this.sendToN8N(fileContent);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.uploading = false;
      this.uploadStatus = {
        type: 'error',
        message: 'Failed to read file. Please try again.'
      };
    };

    // Read the file as text
    reader.readAsText(this.selectedFile);
  }

  private sendToN8N(fileContent: string): void {
    const webhookUrl = environment.n8nWebhookUrl;
    
    // Set headers for plain text content
    const headers = new HttpHeaders({
      'Content-Type': 'text/plain',
      'Accept': 'application/json'
    });

    // Send plain text content directly as the body
    this.http.post<any>(webhookUrl, fileContent, { 
      headers,
      responseType: 'json' as 'json'
    })
    .pipe(
  timeout(300000), // 5 minutes timeout (300,000 ms)
  catchError(error => {
    console.error('Request timeout or error:', error);
    this.uploading = false;
    this.uploadStatus = {
      type: 'error',
      message: error.name === 'TimeoutError' ? 'Request timed out. Please try again.' : 'Request failed. Please try again.'
    };
    return of(null); // Return null to handle gracefully
  })
)
    .subscribe({
      next: (response: any) => {
        console.log('N8N Response:', response);

        this.uploading = false;
        
        // Handle the array response directly
        if (response && response.data && Array.isArray(response.data)) {
          // Process the logs
          const logs = response.data;
          this.processLogs(logs);
          
          this.uploadStatus = {
            type: 'success',
            message: `Successfully processed ${logs.length} log entries from ${this.selectedFile?.name}`
          };
          
          // Calculate summary
          this.calculateSummary(logs);
          
          // Emit event to refresh dashboard
          this.logsUploaded.emit();
          
          // Clear file selection after delay
          setTimeout(() => {
            this.selectedFile = null;
          }, 5000);
        } else {
          this.uploadStatus = {
            type: 'error',
            message: 'Unexpected response format from server'
          };
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploading = false;
        
        let errorMessage = 'Upload failed: ';
        if (error.status === 0) {
          errorMessage += 'Cannot connect to server. Please check if the N8N webhook is accessible.';
        } else if (error.status === 413) {
          errorMessage += 'File is too large.';
        } else if (error.error?.message) {
          errorMessage += error.error.message;
        } else {
          errorMessage += 'Unknown error occurred.';
        }
        
        this.uploadStatus = {
          type: 'error',
          message: errorMessage
        };
      }
    });
  }

  private processLogs(logs: any[]): void {
    // Send logs to the error data service for processing
    this.errorDataService.processUploadedLogs(logs);
  }

  private calculateSummary(logs: any[]): void {
    this.logSummary = {
      errors: logs.filter(log => log.log_level === 'ERROR').length,
      warnings: logs.filter(log => log.log_level === 'WARN').length,
      info: logs.filter(log => log.log_level === 'INFO').length,
      debug: logs.filter(log => log.log_level === 'DEBUG').length,
      total: logs.length
    };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}