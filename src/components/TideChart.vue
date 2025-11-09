<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="chart-title">📊 潮高图表</h3>
      <div class="date-selector">
        <label for="chart-date">选择日期:</label>
        <input
          id="chart-date"
          type="date"
          :value="selectedDate"
          @change="onDateChange"
          class="chart-date-input"
        />
      </div>
    </div>
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { useTideStore } from '@/stores/tideStore'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const tideStore = useTideStore()

const props = defineProps({
  tideHourly: {
    type: Array,
    default: () => []
  }
})

const selectedDate = computed(() => tideStore.selectedDate)

const onDateChange = async (event) => {
  const newDate = event.target.value
  tideStore.selectedDate = newDate
  if (tideStore.latitude && tideStore.longitude) {
    await tideStore.fetchTideData(tideStore.latitude, tideStore.longitude, newDate)
  }
}

const chartData = computed(() => {
  const labels = props.tideHourly.map(item => {
    try {
      const date = new Date(item.fxTime)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch (e) {
      return item.fxTime
    }
  })

  const heights = props.tideHourly.map(item => parseFloat(item.height))

  return {
    labels,
    datasets: [
      {
        label: '潮高 (米)',
        data: heights,
        borderColor: '#0C2B4E',
        backgroundColor: 'rgba(12, 43, 78, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0C2B4E',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#333',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 12
      },
      callbacks: {
        label: function(context) {
          return `Height: ${context.parsed.y.toFixed(2)} m`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '高度 (米)'
      },
      ticks: {
        color: '#666'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    x: {
      ticks: {
        color: '#666',
        maxRotation: 45,
        minRotation: 0
      },
      grid: {
        display: false
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.chart-title {
  color: #333;
  margin: 0;
  font-size: 1.3em;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-selector label {
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.chart-date-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
  cursor: pointer;
  transition: border-color 0.3s;
}

.chart-date-input:hover {
  border-color: #0C2B4E;
}

.chart-date-input:focus {
  outline: none;
  border-color: #0C2B4E;
  box-shadow: 0 0 0 3px rgba(12, 43, 78, 0.1);
}

@media (max-width: 768px) {
  .chart-container {
    padding: 15px;
    margin: 15px 0;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-title {
    font-size: 1.1em;
    margin-bottom: 0;
  }

  .date-selector {
    width: 100%;
  }

  .chart-date-input {
    width: 100%;
  }
}
</style>

