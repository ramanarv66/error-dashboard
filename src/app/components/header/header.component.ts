import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
@Component({
 selector: 'app-header',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="header">
      <h1 class="header-title"> Logs Analyser </h1>
      <div class="header-subtitle">
        REAL-TIME SYSTEM DIAGNOSTICS | {{ currentTime }}
      </div>
    </div>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(private http: HttpClient){




  }
 webhookUrl = 'https://ramana-ai-1.app.n8n.cloud/webhook-test/upload-log-file';
  fileContent: string = '';
  requestPayload: any = null;
  response: any = null;
  error: any = null;

   sendLogFromAssets() {
    console.log('Sending as plain text...');
    this.error = null;
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
                this.response = res || 'File sent successfully (no response body)';
              },
              err => {
                console.error('Error:', err);
                this.error = err.message;
              }
            );
        },
        fileError => {
          this.error = 'Failed to read file: ' + fileError.message;
        }
      );
  }
















  currentTime: string = '';
  private timeSubscription?: Subscription;
  
// Call this method whenever you want
uplodFile() {
  this.http.get('assets/java_application.log', { responseType: 'text' })
    .subscribe(content => {
      this.http.post('https://ramana-ai-1.app.n8n.cloud/webhook/upload-log-file', {
        fileName: 'java_application.log',
        content: content
      }).subscribe(res => console.log('Sent:', res));
    });
}
    uplodFile1() {
      console.log('upload file');
      
    // Read file from assets folder
    this.http.get('assets/java_application.log', { responseType: 'text' })
      .subscribe(fileContent => {
        // Send to n8n webhook
        this.http.post('https://ramana-ai-1.app.n8n.cloud/webhook/upload-log-file', {
          fileName: 'java_application.log',
          content: fileContent
        }).subscribe(
          res => console.log('Success:', res),
          err => console.error('Error:', err)
        );
      });
  }

  ngOnInit(): void {
    this.updateTime();
    this.timeSubscription = interval(1000).subscribe(() => {
      this.updateTime();
    });
  }

  ngOnDestroy(): void {
    this.timeSubscription?.unsubscribe();
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  }

  
}
