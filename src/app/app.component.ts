import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DashboardComponent],
  template: `
    <div class="app-container" [attr.data-theme]="currentTheme()">
      <app-dashboard></app-dashboard>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      transition: all 0.3s ease;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'error-dashboard';
  private themeService = inject(ThemeService);
  currentTheme = this.themeService.currentTheme;

  ngOnInit() {
    // Theme is automatically initialized in the service
    console.log('App initialized with theme:', this.currentTheme());
  }
}