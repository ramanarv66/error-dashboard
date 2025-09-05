import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-error-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-title">{{ title }}</div>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styleUrls: ['./error-chart.component.scss'],
})
export class ErrorChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title!: string;
  @Input() chartType: ChartType = 'line';
  @Input() chartData: any;

  private chart?: Chart;

  ngOnInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.chartType,
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: 'rgb(255, 107, 0)',
              font: {
                family: 'Segoe UI',
                weight: 600,
              },
            },
          },
        },
        scales:
          this.chartType === 'line'
            ? {
                x: {
                  grid: {
                    color: 'rgba(57, 255, 20, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                },
                y: {
                  grid: {
                    color: 'rgba(57, 255, 20, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.6)',
                  },
                },
              }
            : undefined,
      },
    };

    this.chart = new Chart(ctx, config);
  }

  updateChart(newData: any): void {
    if (this.chart) {
      this.chart.data = newData;
      this.chart.update();
    }
  }
}
