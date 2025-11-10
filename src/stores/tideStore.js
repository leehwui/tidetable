import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getTideData, getTideDataByLocationId } from '@/utils/api'
import config from '@/config'

export const useTideStore = defineStore('tide', () => {
  // State
  const tideData = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  const latitude = ref(null)
  const longitude = ref(null)
  const locationId = ref(null)
  const locationName = ref('Unknown Location')
  const isFromCache = ref(false)

  // Computed
  const currentDayTide = computed(() => {
    if (!tideData.value) return null
    return {
      tideTable: tideData.value.tideTable || [],
      tideHourly: tideData.value.tideHourly || []
    }
  })

  const highTides = computed(() => {
    return currentDayTide.value?.tideTable.filter(t => t.type === 'H') || []
  })

  const lowTides = computed(() => {
    return currentDayTide.value?.tideTable.filter(t => t.type === 'L') || []
  })

  // Actions
  const fetchTideData = async (lat, lon, date) => {
    loading.value = true
    error.value = null
    try {
      // Format date to YYYYMMDD format (remove hyphens from YYYY-MM-DD)
      const formattedDate = date ? date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '')
      const data = await getTideData(
        lat,
        lon,
        config.PROJECT_ID,
        config.PRIVATE_KEY,
        config.KEY_ID,
        formattedDate
      )
      tideData.value = data
      isFromCache.value = data.fromCache || false
      latitude.value = lat
      longitude.value = lon
      locationId.value = data.locationId || null
      locationName.value = data.locationName || 'Unknown Location'
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tide data'
    } finally {
      loading.value = false
    }
  }

  const fetchTideDataByLocationId = async (locId, name, date) => {
    loading.value = true
    error.value = null
    try {
      // Format date to YYYYMMDD format (remove hyphens from YYYY-MM-DD)
      const formattedDate = date ? date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '')
      const data = await getTideDataByLocationId(
        locId,
        name,
        config.PROJECT_ID,
        config.PRIVATE_KEY,
        config.KEY_ID,
        formattedDate
      )
      tideData.value = data
      isFromCache.value = data.fromCache || false
      locationId.value = locId
      locationName.value = name
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tide data'
    } finally {
      loading.value = false
    }
  }

  const setSelectedDate = (date) => {
    selectedDate.value = date
  }

  const setLocation = (lat, lon, name) => {
    latitude.value = lat
    longitude.value = lon
    locationName.value = name
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    tideData,
    loading,
    error,
    selectedDate,
    latitude,
    longitude,
    locationId,
    locationName,
    isFromCache,
    // Computed
    currentDayTide,
    highTides,
    lowTides,
    // Actions
    fetchTideData,
    fetchTideDataByLocationId,
    setSelectedDate,
    setLocation,
    clearError
  }
})
