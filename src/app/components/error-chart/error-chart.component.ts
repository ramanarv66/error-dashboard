import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-error-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">{{ title }}</div>
        <div class="chart-legend" *ngIf="showCustomLegend">
          <span class="legend-item" *ngFor="let item of legendItems">
            <span class="legend-color" [style.background-color]="item.color"></span>
            {{ item.label }}: {{ item.value }}
          </span>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(57, 255, 20, 0.2);
      border-radius: 20px;
      padding: 1.5rem;
      position: relative;
      min-height: 400px;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;

      &:hover {
        box-shadow: 0 0 40px rgba(57, 255, 20, 0.3);
        transform: translateY(-2px);
        border-color: rgba(57, 255, 20, 0.4);
      }
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .chart-title {
      font-size: 1.2rem;
      color: #39ff14;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      position: relative;
      padding-bottom: 0.5rem;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 50px;
        height: 2px;
        background: linear-gradient(90deg, #39ff14, transparent);
      }
    }

    .chart-legend {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .chart-wrapper {
      flex: 1;
      position: relative;
      height: 320px;
    }

    canvas {
      max-height: 320px;
    }
  `]
})
export class ErrorChartComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title!: string;
  @Input() chartType: ChartType = 'line';
  @Input() chartData: any;
  @Input() isStacked: boolean = false;
  @Input() showCustomLegend: boolean = false;
  
  private chart?: Chart;
  legendItems: any[] = [];

  ngOnInit(): void {
    if (this.chartData) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: this.chartType,
      data: this.chartData,
      options: this.getChartOptions()
    };

    this.chart = new Chart(ctx, config);
    this.updateLegendItems();
  }

  private getChartOptions(): any {
    if (this.chartType === 'line' && this.isStacked) {
      // Stacked Line Chart Configuration
      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
            labels: {
              color: '#39ff14',
              font: {
                family: 'Segoe UI',
                size: 11,
                weight: 600
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            backgroundColor: 'rgba(10, 14, 39, 0.9)',
            titleColor: '#39ff14',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(57, 255, 20, 0.3)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              footer: (tooltipItems: any) => {
                let sum = 0;
                tooltipItems.forEach((tooltipItem: any) => {
                  sum += tooltipItem.parsed.y;
                });
                return 'Total: ' + sum;
              },
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(57, 255, 20, 0.1)',
              borderColor: 'rgba(57, 255, 20, 0.3)',
              borderWidth: 1,
              drawTicks: true,
              tickColor: 'rgba(57, 255, 20, 0.2)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                size: 10
              },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            display: true,
            stacked: true, // Enable stacking on Y-axis
            type: 'linear' as const,
            grid: {
              color: 'rgba(57, 255, 20, 0.1)',
              borderColor: 'rgba(57, 255, 20, 0.3)',
              borderWidth: 1,
              drawTicks: true,
              tickColor: 'rgba(57, 255, 20, 0.2)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.6)',
              font: {
                size: 10
              },
              stepSize: 5, // Set step size for linear scale
              callback: function(value: any) {
                return value; // Display as integer
              }
            },
            beginAtZero: true,
            suggestedMax: 30 // Adjust based on your data
          }
        }
      };
    } else if (this.chartType === 'doughnut') {
      // Doughnut Chart Configuration
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom' as const,
            labels: {
              color: '#39ff14',
              padding: 15,
              font: {
                family: 'Segoe UI',
                size: 11,
                weight: 600
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i];
                    const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.borderColor ? dataset.borderColor[i] : undefined,
                      lineWidth: dataset.borderWidth || 1,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 14, 39, 0.9)',
            titleColor: '#39ff14',
            bodyColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(57, 255, 20, 0.3)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%', // Creates the doughnut hole
        animation: {
          animateScale: true,
          animateRotate: true
        }
      };
    } else {
      // Default configuration
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#39ff14',
              font: {
                family: 'Segoe UI',
                weight: 600
              }
            }
          }
        }
      };
    }
  }

  private updateChart(): void {
    if (this.chart && this.chartData) {
      this.chart.data = this.chartData;
      this.chart.options = this.getChartOptions();
      this.chart.update();
      this.updateLegendItems();
    } else if (this.chartData) {
      this.createChart();
    }
  }

  private updateLegendItems(): void {
    if (this.showCustomLegend && this.chartData?.datasets) {
      this.legendItems = this.chartData.datasets.map((dataset: any, index: number) => ({
        label: dataset.label,
        color: dataset.borderColor || dataset.backgroundColor,
        value: dataset.data.reduce((a: number, b: number) => a + b, 0)
      }));
    }
  }
}