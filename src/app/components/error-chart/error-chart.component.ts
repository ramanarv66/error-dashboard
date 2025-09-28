import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ThemeService } from '../../services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-error-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <div class="chart-title">{{ title }}</div>
      </div>
      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styleUrls: ['./error-chart.component.scss']
})
export class ErrorChartComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title!: string;
  @Input() chartType: ChartType = 'line';
  @Input() chartData: any;
  @Input() isStacked: boolean = false;
  
  private chart?: Chart;
  private themeService = inject(ThemeService);

  // constructor() {
  //   // Watch for theme changes using effect
  //   effect(() => {
  //     const currentTheme = this.themeService.currentTheme(); // Call the signal to get its value
  //     if (this.chart) {
  //       this.updateChartTheme();
  //     }
  //   });
  // }
  constructor() {
  effect(() => {
    const currentTheme = this.themeService.currentTheme();
    // Delay to ensure theme class is applied to DOM
    setTimeout(() => {
      if (this.chart) {
        // Destroy and recreate chart completely
        this.chart.destroy();
        this.chart = undefined;
        if (this.chartData) {
          this.createChart();
        }
      }
    }, 50);
  });
}

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

    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: this.chartType,
      data: this.chartData,
      options: this.getChartOptions()
    };

    this.chart = new Chart(ctx, config);
  }

  // private getChartOptions(): any {
  //   // Determine if we're in dark mode
  //   const isDarkMode = this.themeService.isDarkMode();
    
  //   // Set colors based on theme
  //   const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#000000';
  //   const gridColor = isDarkMode ? 'rgba(57, 255, 20, 0.1)' : 'rgba(57, 255, 20, 0.1)';
  //   const legendColor = isDarkMode ? '#ffffff' : '#000000';  // White in dark, black in light

  //   if (this.chartType === 'line' && this.isStacked) {
  //     return {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       interaction: {
  //         mode: 'index' as const,
  //         intersect: false,
  //       },
  //       plugins: {
  //         legend: {
  //           display: true,
  //           position: 'top' as const,
  //           labels: {
  //             color: legendColor,
  //             font: {
  //               family: 'Segoe UI',
  //               size: 11,
  //               weight: 600
  //             },
  //             padding: 15,
  //             usePointStyle: true,
  //             pointStyle: 'rectRounded'
  //           }
  //         },
  //         tooltip: {
  //           mode: 'index' as const,
  //           intersect: false,
  //           backgroundColor: isDarkMode ? 'rgba(10, 14, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
  //           titleColor: isDarkMode ? '#39ff14' : '#000000',
  //           bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  //           borderColor: 'rgba(57, 255, 20, 0.3)',
  //           borderWidth: 1,
  //           padding: 12,
  //           displayColors: true,
  //           callbacks: {
  //             footer: (tooltipItems: any) => {
  //               let sum = 0;
  //               tooltipItems.forEach((tooltipItem: any) => {
  //                 sum += tooltipItem.parsed.y;
  //               });
  //               return 'Total: ' + sum;
  //             },
  //           }
  //         }
  //       },
  //       scales: {
  //         x: {
  //           display: true,
  //           grid: {
  //             color: gridColor,
  //             borderColor: 'rgba(57, 255, 20, 0.3)',
  //           },
  //           ticks: {
  //             color: textColor,
  //             font: {
  //               size: 10
  //             },
  //             maxRotation: 45,
  //             minRotation: 0
  //           }
  //         },
  //         y: {
  //           display: true,
  //           stacked: true,
  //           type: 'linear' as const,
  //           grid: {
  //             color: gridColor,
  //             borderColor: 'rgba(57, 255, 20, 0.3)',
  //           },
  //           ticks: {
  //             color: textColor,
  //             font: {
  //               size: 10
  //             },
  //             stepSize: 5,
  //             callback: function(value: any) {
  //               return value;
  //             }
  //           },
  //           beginAtZero: true,
  //           suggestedMax: 30
  //         }
  //       }
  //     };
  //   } else if (this.chartType === 'doughnut') {
  //     // Doughnut Chart Configuration - ERROR TYPE DISTRIBUTION
  //     return {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: true,
  //           position: 'bottom' as const,
  //           labels: {
  //             color: legendColor,  // This fixes the legend text color
  //             padding: 15,
  //             font: {
  //               family: 'Segoe UI',
  //               size: 12,
  //               weight: 600
  //             },
  //             generateLabels: (chart: any) => {
  //               const data = chart.data;
  //               if (data.labels.length && data.datasets.length) {
  //                 return data.labels.map((label: string, i: number) => {
  //                   const dataset = data.datasets[0];
  //                   const value = dataset.data[i];
  //                   const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
  //                   const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  //                   return {
  //                     text: `${label}: ${value} (${percentage}%)`,
  //                     fillStyle: dataset.backgroundColor[i],
  //                     strokeStyle: dataset.borderColor ? dataset.borderColor[i] : undefined,
  //                     lineWidth: dataset.borderWidth || 1,
  //                     hidden: false,
  //                     index: i
  //                   };
  //                 });
  //               }
  //               return [];
  //             }
  //           }
  //         },
  //         tooltip: {
  //           backgroundColor: isDarkMode ? 'rgba(10, 14, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
  //           titleColor: isDarkMode ? '#39ff14' : '#000000',
  //           bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  //           borderColor: 'rgba(57, 255, 20, 0.3)',
  //           borderWidth: 1,
  //           padding: 12,
  //           callbacks: {
  //             label: (context: any) => {
  //               const label = context.label || '';
  //               const value = context.parsed;
  //               const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
  //               const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  //               return `${label}: ${value} (${percentage}%)`;
  //             }
  //           }
  //         }
  //       },
  //       cutout: '60%',
  //       animation: {
  //         animateScale: true,
  //         animateRotate: true
  //       }
  //     };
  //   } else {
  //     // Default configuration
  //     return {
  //       responsive: true,
  //       maintainAspectRatio: false,
  //       plugins: {
  //         legend: {
  //           display: true,
  //           labels: {
  //             color: legendColor,
  //             font: {
  //               family: 'Segoe UI',
  //               weight: 600
  //             }
  //           }
  //         }
  //       }
  //     };
  //   }
  // }
  private getChartOptions(): any {
  const isDarkMode = this.themeService.isDarkMode();
  const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#000000';
  const gridColor = isDarkMode ? 'rgba(57, 255, 20, 0.1)' : 'rgba(200, 200, 200, 0.2)';
  const legendColor = isDarkMode ? '#ffffff' : '#000000';

  // Check if this is the vertical bar chart
  if (this.chartType === 'bar') {
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
            color: legendColor,
            font: {
              family: 'Segoe UI',
              size: 11,
              weight: 600
            },
            padding: 15,
            usePointStyle: false,
            boxWidth: 15,
            boxHeight: 12,
            generateLabels: (chart: any) => {
              const datasets = chart.data.datasets;
              return datasets.map((dataset: any, i: number) => ({
                text: dataset.label,
                fillStyle: dataset.backgroundColor,
                strokeStyle: dataset.borderColor,
                lineWidth: 2,
                hidden: !chart.isDatasetVisible(i),
                index: i
              }));
            }
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: isDarkMode ? 'rgba(10, 14, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDarkMode ? '#39ff14' : '#000000',
          bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(57, 255, 20, 0.3)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y + ' logs';
              return label;
            },
            footer: function(tooltipItems: any) {
              let sum = 0;
              tooltipItems.forEach(function(tooltipItem: any) {
                sum += tooltipItem.parsed.y;
              });
              return 'Total: ' + sum + ' logs';
            }
          }
        },
        // Add animation
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart' as const
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
            borderColor: gridColor,
          },
          ticks: {
            color: textColor,
            font: {
              size: 11,
              weight: 500
            },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0
          },
          title: {
            display: false
          }
        },
        y: {
          display: true,
          grid: {
            color: gridColor,
            borderColor: gridColor,
            drawTicks: true,
            drawBorder: true
          },
          ticks: {
            color: textColor,
            font: {
              size: 10
            },
            stepSize: 5,
            callback: function(value: any) {
              return value;
            }
          },
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Logs',
            color: textColor,
            font: {
              size: 12,
              weight: 600
            }
          }
        }
      }
    };
  } 
  else if (this.chartType === 'doughnut') {
    // Doughnut configuration remains unchanged
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            color: legendColor,
            padding: 15,
            font: {
              family: 'Segoe UI',
              size: 12,
              weight: 600
            },
            generateLabels: (chart: any) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label: string, i: number) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[i];
                  const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
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
          backgroundColor: isDarkMode ? 'rgba(10, 14, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDarkMode ? '#39ff14' : '#000000',
          bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(57, 255, 20, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%',
      animation: {
        animateScale: true,
        animateRotate: true
      }
    };
  }
  // Default configuration
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: legendColor,
          font: {
            family: 'Segoe UI',
            weight: 600
          }
        }
      }
    }
  };
}

  private updateChart(): void {
    if (this.chart && this.chartData) {
      this.chart.data = this.chartData;
      this.chart.options = this.getChartOptions();
      this.chart.update();
    } else if (this.chartData) {
      this.createChart();
    }
  }

  private updateChartTheme(): void {
    if (this.chart) {
      // Update chart options with new theme colors
      this.chart.options = this.getChartOptions();
      this.chart.update();
    }
  }
}