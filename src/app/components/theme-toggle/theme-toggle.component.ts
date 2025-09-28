import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-toggle-container">
      <button 
        class="theme-toggle-btn" 
        (click)="toggleTheme()"
        [attr.aria-label]="'Switch to ' + (isDarkMode() ? 'light' : 'dark') + ' mode'"
        [title]="'Switch to ' + (isDarkMode() ? 'light' : 'dark') + ' mode'">
        
        <!-- Sun Icon (Light Mode) -->
        <svg *ngIf="!isDarkMode()" class="theme-icon sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>

        <!-- Moon Icon (Dark Mode) -->
        <svg *ngIf="isDarkMode()" class="theme-icon moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Optional: Text label -->
      <span class="theme-label">{{ isDarkMode() ? 'Dark' : 'Light' }}</span>
    </div>
  `,
  styles: [`
    .theme-toggle-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-toggle-btn {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(57, 255, 20, 0.05));
      border: 2px solid rgba(57, 255, 20, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: radial-gradient(circle, rgba(57, 255, 20, 0.3), transparent);
        transition: width 0.3s, height 0.3s;
        transform: translate(-50%, -50%);
      }

      &:hover {
        transform: scale(1.1) rotate(180deg);
        border-color: #39ff14;
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);

        &::before {
          width: 100px;
          height: 100px;
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .theme-icon {
      width: 24px;
      height: 24px;
      color: #39ff14;
      transition: transform 0.3s ease;
      animation: fadeIn 0.3s ease;
    }

    .theme-label {
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-primary);
      opacity: 0.8;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.8) rotate(-90deg);
      }
      to {
        opacity: 1;
        transform: scale(1) rotate(0deg);
      }
    }

    :host-context(.light-theme) {
      .theme-toggle-btn {
        background: linear-gradient(135deg, rgba(255, 204, 0, 0.1), rgba(255, 204, 0, 0.05));
        border-color: rgba(255, 204, 0, 0.3);

        &:hover {
          border-color: #ffcc00;
          box-shadow: 0 0 20px rgba(255, 204, 0, 0.4);
        }
      }

      .theme-icon {
        color: #f39c12;
      }
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }
}
