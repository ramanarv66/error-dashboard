import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>('dark');
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    if (this.isBrowser) {
      // Load saved theme from localStorage
      const savedTheme = localStorage.getItem('dashboard-theme') as Theme;
      if (savedTheme) {
        this.currentTheme.set(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme.set(prefersDark ? 'dark' : 'light');
      }

      // Apply theme immediately on initialization
      this.applyTheme(this.currentTheme());

      // Watch for theme changes
      effect(() => {
        const theme = this.currentTheme();
        this.applyTheme(theme);
        localStorage.setItem('dashboard-theme', theme);
      });
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.currentTheme.set(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) return;
    
    // Get the root document element
    const documentElement = document.documentElement;
    
    // Remove existing theme classes
    documentElement.classList.remove('dark-theme', 'light-theme');
    document.body.classList.remove('dark-theme', 'light-theme');
    
    // Add new theme class to both html and body
    documentElement.classList.add(`${theme}-theme`);
    document.body.classList.add(`${theme}-theme`);
    
    // Also set as data attribute for CSS selectors
    documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0e27' : '#ffffff');
    }
    
    console.log(`Theme applied: ${theme}`);
  }

  isDarkMode(): boolean {
    return this.currentTheme() === 'dark';
  }
}
