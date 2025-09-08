import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDataService } from '../../services/error-data.service';

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
        accept=".log,.txt,.json"
        style="display: none">
      
      <button 
        class="upload-button" 
        (click)="fileInput.click()"
        [disabled]="uploading">
        <span class="upload-icon">📁</span>
        {{ uploading ? 'Getting...' : 'Get Log File' }}
      </button>
      
      <div class="file-info" *ngIf="selectedFile">
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(57, 255, 20, 0.2);
      border-radius: 15px;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(57, 255, 20, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .upload-icon {
      font-size: 1.2rem;
    }

    .file-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
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
  `]
})
export class FileUploadComponent {
  private errorDataService = inject(ErrorDataService);
  
  selectedFile: File | null = null;
  uploading = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    
    this.uploading = true;
    this.errorDataService.uploadLogFile(this.selectedFile).subscribe({
      next: (logs) => {
        console.log('File uploaded successfully', logs);
        this.uploading = false;
        this.selectedFile = null;
      },
      error: (error) => {
        console.error('Upload failed', error);
        this.uploading = false;
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}