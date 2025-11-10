<template>
  <div class="tide-table-container">
    <header class="header">
      <h1>🌊 潮汐表</h1>
      <p class="subtitle">实时潮汐信息</p>
    </header>

    <main class="main-content">
      <!-- City Selector Section -->
      <section class="city-selector-section">
        <div class="selector-group">
          <select v-model="tideStore.locationId" class="city-select" @change="onCityChange">
            <option value="">选择潮汐站...</option>
            <option v-for="station in tideStations" :key="station.id" :value="station.id">
              {{ station.name }}
            </option>
          </select>
          <button @click="getCurrentLocation" class="btn-location" :disabled="tideStore.loading">
            📍 使用我的位置
          </button>
        </div>
        <div v-if="tideStore.locationName" class="location-display">
          <span class="location-icon">📍</span>
          <p class="location-name">{{ tideStore.locationName }}</p>
          <p class="coordinates" v-if="tideStore.latitude && tideStore.longitude">
            {{ tideStore.latitude.toFixed(4) }}°, {{ tideStore.longitude.toFixed(4) }}°
          </p>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="tideStore.loading" class="loading">
        <div class="spinner"></div>
        <p>加载潮汐数据中...</p>
      </div>

      <!-- Error State -->
      <div v-if="tideStore.error" class="error-message">
        <p>⚠️ {{ tideStore.error }}</p>
        <button @click="tideStore.clearError" class="btn-dismiss">关闭</button>
      </div>

      <!-- Tide Data Display -->
      <section v-if="tideStore.currentDayTide && !tideStore.loading" class="tide-data-section">
        <!-- Cache Indicator -->
        <div v-if="tideStore.isFromCache" class="cache-indicator">
          💾 数据来自缓存
        </div>

        <!-- High Tides -->
        <div class="tides-section">
          <h3 class="section-title">🌊 高潮</h3>
          <div v-if="tideStore.highTides.length > 0" class="tides-list">
            <div v-for="(tide, index) in tideStore.highTides" :key="`high-${index}`" class="tide-item high-tide">
              <span class="tide-time">{{ formatTime(tide.fxTime) }}</span>
              <span class="tide-height">{{ tide.height }} 米</span>
            </div>
          </div>
          <p v-else class="no-data">未记录高潮</p>
        </div>

        <!-- Low Tides -->
        <div class="tides-section">
          <h3 class="section-title">🌊 低潮</h3>
          <div v-if="tideStore.lowTides.length > 0" class="tides-list">
            <div v-for="(tide, index) in tideStore.lowTides" :key="`low-${index}`" class="tide-item low-tide">
              <span class="tide-time">{{ formatTime(tide.fxTime) }}</span>
              <span class="tide-height">{{ tide.height }} 米</span>
            </div>
          </div>
          <p v-else class="no-data">未记录低潮</p>
        </div>
      </section>

      <!-- Tide Chart -->
      <TideChart
        v-if="tideStore.currentDayTide && tideStore.currentDayTide.tideHourly.length > 0 && !tideStore.loading"
        :tideHourly="tideStore.currentDayTide.tideHourly"
      />

      <!-- No Data State -->
      <div v-if="!tideStore.tideData && !tideStore.loading && !tideStore.error" class="no-data-state">
        <p>📍 请选择一个位置来查看潮汐信息</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTideStore } from '@/stores/tideStore'
import TideChart from '@/components/TideChart.vue'
import tideStationsData from '@/data/tide-stations.json'

const tideStore = useTideStore()
const tideStations = ref([])

onMounted(() => {
  tideStations.value = tideStationsData
})

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      try {
        // Fetch tide data which returns location ID and name
        await tideStore.fetchTideData(latitude, longitude, tideStore.selectedDate)
        // locationId and locationName are automatically updated in the store
      } catch (error) {
        console.error('Error fetching tide data:', error)
      }
    },
    (error) => {
      console.error('Geolocation error:', error)
      alert(`Unable to get your location: ${error.message}. Please use manual input or check browser permissions.`)
    }
  )
}

const onCityChange = async () => {
  if (!tideStore.locationId) {
    return
  }
  const station = tideStations.value.find(s => s.id === tideStore.locationId)
  if (station) {
    tideStore.setLocation(station.lat, station.lon, station.name)
    // Use location ID directly, skip POI endpoint
    await tideStore.fetchTideDataByLocationId(station.id, station.name, tideStore.selectedDate)
  }
}

const formatTime = (fxTime) => {
  // Parse ISO 8601 format like "2021-02-06T03:48+08:00"
  try {
    const date = new Date(fxTime)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch (e) {
    return fxTime
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.tide-table-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0C2B4E 0%, #1A3D64 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  padding: 20px 0;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.1em;
  opacity: 0.9;
}

.main-content {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 20px;
}

/* City Selector Section */
.city-selector-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.selector-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.city-select {
  flex: 1;
  padding: 16px 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  transition: border-color 0.3s;
  min-height: 50px;
}

.city-select:hover {
  border-color: #0C2B4E;
}

.city-select:focus {
  outline: none;
  border-color: #0C2B4E;
  box-shadow: 0 0 0 3px rgba(12, 43, 78, 0.1);
}

.location-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  margin-top: 12px;
}

.location-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.location-name {
  font-size: 1em;
  font-weight: bold;
  color: #333;
  margin: 0;
  flex-shrink: 0;
}

.coordinates {
  font-size: 0.85em;
  color: #666;
  margin: 0;
  flex-shrink: 0;
}

.btn-location {
  background: linear-gradient(135deg, #0C2B4E 0%, #1A3D64 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-location:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(12, 43, 78, 0.4);
}

.btn-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Manual Location Section */
.manual-location-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.manual-location-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1em;
}

.input-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.location-input {
  flex: 1;
  min-width: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
}

.location-input:focus {
  outline: none;
  border-color: #0C2B4E;
  box-shadow: 0 0 0 3px rgba(12, 43, 78, 0.1);
}

.btn-set-location {
  background: linear-gradient(135deg, #0C2B4E 0%, #1A3D64 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-set-location:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(12, 43, 78, 0.4);
}

.btn-set-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Date Section */
.date-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.date-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
}

.date-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
}

.date-input:focus {
  outline: none;
  border-color: #0C2B4E;
  box-shadow: 0 0 0 3px rgba(12, 43, 78, 0.1);
}

/* Loading State */
.loading {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0C2B4E;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #666;
  font-size: 1.1em;
}

/* Error State */
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-message p {
  color: #c33;
  margin: 0 0 15px 0;
  font-size: 1em;
}

.btn-dismiss {
  background: #c33;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.btn-dismiss:hover {
  background: #a22;
}

/* Tide Data Section */
.tide-data-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  position: relative;
}

.cache-indicator {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tide-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.info-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.info-card h3 {
  margin: 0 0 10px 0;
  font-size: 1em;
  color: #333;
}

.time {
  font-size: 1.3em;
  font-weight: bold;
  color: #667eea;
  margin: 0;
}

.moon-phase {
  font-size: 1.1em;
  color: #666;
  margin: 0;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

/* Tides Section */
.tides-section {
  margin-top: 0;
}

.section-title {
  font-size: 1.3em;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #0C2B4E;
  padding-bottom: 10px;
}

.tides-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tide-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 6px;
  font-weight: bold;
}

.tide-item.high-tide {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e72 100%);
  color: white;
}

.tide-item.low-tide {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
}

.tide-time {
  font-size: 1.1em;
}

.tide-height {
  font-size: 1em;
  opacity: 0.9;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

/* No Data State */
.no-data-state {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.no-data-state p {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    max-width: 100%;
    padding: 15px;
  }

  .tide-info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .tide-table-container {
    padding: 15px;
  }

  .header h1 {
    font-size: 2em;
  }

  .header {
    margin-bottom: 20px;
    padding: 15px 0;
  }

  .main-content {
    max-width: 100%;
    padding: 10px;
  }

  .city-selector-section {
    padding: 15px;
  }

  .selector-group {
    flex-direction: column;
    gap: 10px;
  }

  .city-select,
  .btn-location {
    width: 100%;
  }

  .location-display {
    flex-direction: column;
    gap: 10px;
  }

  .location-info {
    flex-direction: column;
    gap: 10px;
  }

  .date-input {
    width: 100%;
    padding: 12px;
  }

  .tide-info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .tide-data-section {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .tides-section {
    padding: 15px;
  }

  .tides-list {
    gap: 10px;
  }

  .tide-item {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 1.6em;
  }

  .subtitle {
    font-size: 0.95em;
  }

  .tide-table-container {
    padding: 10px;
  }

  .main-content {
    padding: 5px;
  }

  .city-selector-section,
  .date-section,
  .tides-section {
    padding: 12px;
    margin: 10px 0;
  }

  .selector-group {
    flex-direction: column;
    gap: 8px;
  }

  .city-select,
  .date-input,
  .btn-location {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }

  .tide-item {
    padding: 10px;
    font-size: 0.9em;
  }

  .tide-time {
    font-size: 0.85em;
  }

  .tide-height {
    font-size: 0.9em;
  }

  .section-title {
    font-size: 1.1em;
  }

  .info-card {
    padding: 12px;
  }
}
</style>
