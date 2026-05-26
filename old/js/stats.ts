import "../scss/gen/stats.css";

import { LineChart } from 'chartist';

let chart = new LineChart('#chart', {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'],
  series: [
    [1, 2, 4, 8, 6, -2, -1, -4, -6, -2]
  ]
}, {
  high: 10,
  low: -10,
  axisX: {
    labelInterpolationFnc: (value, index) => (index % 2 === 0 ? value : null)
  }
});

// Function to calculate min and max values from data
function calculateMinMax(data: number[]): { min: number, max: number } {
  if (data.length === 0) return { min: 0, max: 10 };
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Add some padding to make the chart more readable
  const padding = (max - min) * 0.1;
  return {
    min: min - padding,
    max: max + padding
  };
}

// Function to fetch and update chart data
async function updateChart(metric: string) {
  try {
    // TODO FIX This needs to use the url_for or something similar
    const response = await fetch(`/stats/chart-data/${metric}`);
    const data = await response.json();
    
    
    const { min, max } = calculateMinMax(data.series[0]);
  
    // Update chart with new data
    chart.update({
      labels: data.labels,
      series: data.series
    }, {
      high: max,
      low: min,
      axisX: {
        labelInterpolationFnc: (value, index) => (index % 2 === 0 ? value : null)
      }
    });
  } catch (error) {
    console.error('Error updating chart:', error);
  }
}

// Set up event listener for metric selection
document.getElementById('metric-select')!.addEventListener('change', (event) => {
  const selectedMetric = (event.target as HTMLSelectElement).value;
  updateChart(selectedMetric);
});

// Initialize with default metric
updateChart('cpu_util');