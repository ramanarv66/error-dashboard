import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErrorLog } from '../../models/error-log.model';
import { ThemeService } from '../../services/theme.service';

type SortOrder = 'asc' | 'desc' | null;
type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

@Component({
  selector: 'app-error-log-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="log-container" [class.light-theme-table]="!isDarkMode()">
      <div class="log-header">
        <div class="log-title" [class.light-theme-title]="!isDarkMode()">Recent System Logs</div>
        <div class="log-stats">
          <span class="log-count" [class.light-theme-count]="!isDarkMode()">
            {{ filteredLogs.length }} of {{ errorLogs.length }} logs
          </span>
        </div>
      </div>

      <!-- Search and Filter Bar -->
      <div class="search-filter-bar">
        <!-- Search Input -->
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input 
            type="text" 
            class="search-input"
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterLogs()"
            placeholder="Search by message or level..."
            [class.light-theme-input]="!isDarkMode()">
          <button 
            *ngIf="searchTerm" 
            class="clear-btn"
            (click)="clearSearch()"
            [class.light-theme-btn]="!isDarkMode()">
            ✕
          </button>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <button 
            class="filter-chip"
            [class.active]="selectedLevel === null"
            [class.light-theme-chip]="!isDarkMode()"
            (click)="filterByLevel(null)">
            All
          </button>
          <button 
            class="filter-chip error-chip"
            [class.active]="selectedLevel === 'ERROR'"
            (click)="filterByLevel('ERROR')">
            ERROR ({{ getCountByLevel('ERROR') }})
          </button>
          <button 
            class="filter-chip warn-chip"
            [class.active]="selectedLevel === 'WARN'"
            (click)="filterByLevel('WARN')">
            WARN ({{ getCountByLevel('WARN') }})
          </button>
          <button 
            class="filter-chip info-chip"
            [class.active]="selectedLevel === 'INFO'"
            (click)="filterByLevel('INFO')">
            INFO ({{ getCountByLevel('INFO') }})
          </button>
          <button 
            class="filter-chip debug-chip"
            [class.active]="selectedLevel === 'DEBUG'"
            (click)="filterByLevel('DEBUG')">
            DEBUG ({{ getCountByLevel('DEBUG') }})
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="log-table">
          <thead>
            <tr>
              <th [class.light-theme-header]="!isDarkMode()">Date</th>
              <th [class.light-theme-header]="!isDarkMode()">Time</th>
              <th [class.light-theme-header]="!isDarkMode()">Thread-Id</th>
              <th 
                class="sortable-header" 
                [class.light-theme-header]="!isDarkMode()"
                (click)="toggleSort()">
                <div class="header-content">
                  <span>Level</span>
                  <div class="sort-indicators">
                    <svg class="sort-icon" [class.active]="sortOrder === 'asc'" width="12" height="12" viewBox="0 0 24 24">
                      <path d="M7 14l5-5 5 5" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                    <svg class="sort-icon" [class.active]="sortOrder === 'desc'" width="12" height="12" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                  </div>
                </div>
              </th>
              <th [class.light-theme-header]="!isDarkMode()">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of paginatedLogs; let i = index" 
                [class.error-row]="log.log_level === 'ERROR'"
                [@tableRow]="'in'">
              <td [class.light-theme-cell]="!isDarkMode()">{{ log.date }}</td>
              <td class="time-cell" [class.light-theme-cell]="!isDarkMode()">{{ log.time }}</td>
                <td class="time-cell" [class.light-theme-cell]="!isDarkMode()">{{ log.thread_id }}</td>
              <td>
                <span class="log-level" [ngClass]="getLogLevelClass(log.log_level)">
                  {{ log.log_level }}
                </span>
              </td>
              <td class="message-cell" [class.light-theme-cell]="!isDarkMode()" [title]="log.message">
                <span [innerHTML]="highlightSearchTerm(log.message)"></span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- No Results Message -->
        <div class="no-results" *ngIf="filteredLogs.length === 0 && searchTerm">
          <span class="no-results-icon">🔍</span>
          <p [class.light-theme-text]="!isDarkMode()">
            No logs found matching "{{ searchTerm }}"
          </p>
          <button 
            class="clear-search-btn"
            [class.light-theme-btn]="!isDarkMode()"
            (click)="clearSearch()">
            Clear Search
          </button>
        </div>

        <!-- No Data Message -->
        <div class="no-data" *ngIf="errorLogs.length === 0 && !loading">
          <span class="no-data-icon">📊</span>
          <p [class.light-theme-text]="!isDarkMode()">No logs available</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button 
          class="page-btn"
          [disabled]="currentPage === 1"
          [class.light-theme-btn]="!isDarkMode()"
          (click)="goToPage(currentPage - 1)">
          ←
        </button>
        <span class="page-info" [class.light-theme-text]="!isDarkMode()">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          class="page-btn"
          [disabled]="currentPage === totalPages"
          [class.light-theme-btn]="!isDarkMode()"
          (click)="goToPage(currentPage + 1)">
          →
        </button>
        <select 
          class="page-size-select"
          [class.light-theme-select]="!isDarkMode()"
          [(ngModel)]="pageSize"
          (ngModelChange)="onPageSizeChange()">
          <option [value]="10">10 rows</option>
          <option [value]="25">25 rows</option>
          <option [value]="50">50 rows</option>
          <option [value]="100">100 rows</option>
        </select>
      </div>
    </div>
  `,
  styles: [`
    .log-container {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(57, 255, 20, 0.2);
      border-radius: 20px;
      padding: 1.5rem;
      overflow: hidden;
      transition: all 0.3s ease;

      &.light-theme-table {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(57, 255, 20, 0.15);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      }
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .log-title {
      font-size: 1.2rem;
      color: #39ff14;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;

      &.light-theme-title {
        color: #000000;
        font-weight: 700;
      }
    }

    .log-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .log-count {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.6);
      
      &.light-theme-count {
        color: #000000;
        opacity: 0.7;
        font-weight: 500;
      }
    }

    // Search and Filter Bar
    .search-filter-bar {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (min-width: 768px) {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;

      .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 3rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(57, 255, 20, 0.2);
        border-radius: 25px;
        color: #ffffff;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        outline: none;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
          border-color: #39ff14;
          box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        &.light-theme-input {
          background: rgba(0, 0, 0, 0.05);
          color: #000000;
          border-color: rgba(0, 0, 0, 0.2);

          &::placeholder {
            color: rgba(0, 0, 0, 0.4);
          }

          &:focus {
            border-color: #39ff14;
            background: rgba(255, 255, 255, 1);
          }
        }
      }

      .clear-btn {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: rgba(255, 255, 255, 0.6);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;

        &:hover {
          background: rgba(255, 59, 48, 0.2);
          color: #ff3b30;
        }

        &.light-theme-btn {
          background: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.6);

          &:hover {
            background: rgba(255, 59, 48, 0.2);
            color: #ff3b30;
          }
        }
      }
    }

    .quick-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-chip {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.active {
        background: rgba(57, 255, 20, 0.2);
        border-color: #39ff14;
        color: #39ff14;
      }

      &.error-chip.active {
        background: rgba(255, 59, 48, 0.2);
        border-color: #ff3b30;
        color: #ff3b30;
      }

      &.warn-chip.active {
        background: rgba(255, 204, 0, 0.2);
        border-color: #ffcc00;
        color: #ffcc00;
      }

      &.info-chip.active {
        background: rgba(0, 122, 255, 0.2);
        border-color: #007aff;
        color: #007aff;
      }

      &.debug-chip.active {
        background: rgba(175, 82, 222, 0.2);
        border-color: #af52de;
        color: #af52de;
      }

      &.light-theme-chip {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.7);

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        &.active {
          color: #39ff14;
        }
      }
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.2);
      max-height: 500px;
      overflow-y: auto;

      .light-theme-table & {
        background: rgba(248, 249, 250, 0.5);
        border: 1px solid rgba(57, 255, 20, 0.1);
      }

      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(57, 255, 20, 0.3);
        border-radius: 4px;

        &:hover {
          background: rgba(57, 255, 20, 0.5);
        }
      }
    }

    .log-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;

      thead {
        position: sticky;
        top: 0;
        z-index: 10;
      }

      th {
        background: rgba(57, 255, 20, 0.1);
        color: #39ff14;
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.85rem;
        border-bottom: 2px solid rgba(57, 255, 20, 0.3);
        white-space: nowrap;

        &.light-theme-header {
          background: linear-gradient(135deg, rgba(57, 255, 20, 0.1), rgba(46, 204, 113, 0.1));
          color: #000000;
          font-weight: 700;
          border-bottom: 2px solid rgba(57, 255, 20, 0.2);
        }

        &.sortable-header {
          cursor: pointer;
          user-select: none;

          &:hover {
            background: rgba(57, 255, 20, 0.15);
          }

          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
          }

          .sort-indicators {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .sort-icon {
            opacity: 0.3;
            transition: all 0.2s ease;

            &.active {
              opacity: 1;
              color: #39ff14;
            }
          }
        }
      }

      td {
        padding: 0.8rem 1rem;
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        transition: all 0.2s ease;

        &.light-theme-cell {
          color: #000000;
          font-weight: 500;
          border-bottom: 1px solid rgba(189, 195, 199, 0.2);
          background: rgba(255, 255, 255, 0.5);
        }
      }

      tr {
        transition: all 0.2s ease;

        &:hover {
          background: rgba(57, 255, 20, 0.05);

          td {
            color: rgba(255, 255, 255, 0.95);
            
            &.light-theme-cell {
              color: #000000;
              background: rgba(57, 255, 20, 0.03);
            }
          }
        }
      }

      .message-cell {
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        :deep(.highlight) {
          background: rgba(57, 255, 20, 0.3);
          color: #39ff14;
          padding: 0 2px;
          border-radius: 2px;
        }
      }

      .log-level {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.2s ease;

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
      }
    }

    .no-results, .no-data {
      text-align: center;
      padding: 3rem;

      .no-results-icon, .no-data-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 1rem;
        
        &.light-theme-text {
          color: #000000;
          opacity: 0.6;
        }
      }

      .clear-search-btn {
        padding: 0.5rem 1.5rem;
        background: rgba(57, 255, 20, 0.1);
        border: 1px solid rgba(57, 255, 20, 0.3);
        border-radius: 20px;
        color: #39ff14;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;

        &:hover {
          background: rgba(57, 255, 20, 0.2);
          transform: translateY(-2px);
        }

        &.light-theme-btn {
          background: rgba(57, 255, 20, 0.1);
          color: #27ae60;
          border-color: rgba(57, 255, 20, 0.3);
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .page-btn {
        padding: 0.5rem 1rem;
        background: rgba(57, 255, 20, 0.1);
        border: 1px solid rgba(57, 255, 20, 0.3);
        border-radius: 8px;
        color: #39ff14;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;

        &:hover:not(:disabled) {
          background: rgba(57, 255, 20, 0.2);
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        &.light-theme-btn {
          background: rgba(57, 255, 20, 0.1);
          color: #27ae60;
        }
      }

      .page-info {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;

        &.light-theme-text {
          color: #000000;
          opacity: 0.7;
        }
      }

      .page-size-select {
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(57, 255, 20, 0.3);
        border-radius: 8px;
        color: #39ff14;
        cursor: pointer;
        outline: none;

        &.light-theme-select {
          background: rgba(255, 255, 255, 0.95);
          color: #000000;
          border-color: rgba(57, 255, 20, 0.3);
        }
      }
    }
  `],
  animations: [
    // Add animation if needed
  ]
})
export class ErrorLogTableComponent implements OnInit, OnChanges {
  @Input() errorLogs: ErrorLog[] = [];
  @Input() loading: boolean = false;
  
  private themeService = inject(ThemeService);

  // Search and filter properties
  searchTerm: string = '';
  selectedLevel: LogLevel | null = null;
  filteredLogs: ErrorLog[] = [];
  
  // Sorting properties
  sortOrder: SortOrder = null;
  private levelOrder: Record<LogLevel, number> = {
    'ERROR': 4,
    'WARN': 3,
    'INFO': 2,
    'DEBUG': 1
  };
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 25;
  paginatedLogs: ErrorLog[] = [];
  totalPages: number = 1;

  ngOnInit(): void {
    this.filterLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['errorLogs']) {
      this.filterLogs();
    }
  }

  // Search and filter methods
  filterLogs(): void {
    let filtered = [...this.errorLogs];
    
    // Apply level filter
    if (this.selectedLevel) {
      filtered = filtered.filter(log => log.log_level === this.selectedLevel);
    }
    
    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(search) ||
        log.log_level.toLowerCase().includes(search)
      );
    }
    
    this.filteredLogs = filtered;
    this.applySorting();
  }

  filterByLevel(level: LogLevel | null): void {
    this.selectedLevel = level;
    this.filterLogs();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterLogs();
  }

  getCountByLevel(level: LogLevel): number {
    return this.errorLogs.filter(log => log.log_level === level).length;
  }

  // Sorting methods
  toggleSort(): void {
    if (this.sortOrder === null) {
      this.sortOrder = 'asc';
    } else if (this.sortOrder === 'asc') {
      this.sortOrder = 'desc';
    } else {
      this.sortOrder = null;
    }
    this.applySorting();
  }

  private applySorting(): void {
    let sorted = [...this.filteredLogs];
    
    if (this.sortOrder) {
      sorted.sort((a, b) => {
        const aLevel = this.levelOrder[a.log_level as LogLevel];
        const bLevel = this.levelOrder[b.log_level as LogLevel];
        
        if (this.sortOrder === 'asc') {
          return aLevel - bLevel;
        } else {
          return bLevel - aLevel;
        }
      });
    }
    
    this.filteredLogs = sorted;
    this.calculatePagination();
  }

  // Pagination methods
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredLogs.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    this.updatePaginatedLogs();
  }

  updatePaginatedLogs(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedLogs();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  // Highlight search term in message
  highlightSearchTerm(message: string): string {
    if (!this.searchTerm) {
      return message;
    }
    
    const regex = new RegExp(`(${this.escapeRegex(this.searchTerm)})`, 'gi');
    return message.replace(regex, '<span class="highlight">$1</span>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Helper methods
  getLogLevelClass(logLevel: string): string {
    return logLevel.toLowerCase();
  }

  isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }
}