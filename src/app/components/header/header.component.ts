import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
 selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <h1 class="header-title">Quantum Error Monitor</h1>
      <div class="header-subtitle">
        REAL-TIME SYSTEM DIAGNOSTICS | {{ currentTime }}
      </div>
    </div>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  private timeSubscription?: Subscription;

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
