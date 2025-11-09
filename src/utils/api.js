/**
 * API Service Module
 * Handles tide data fetching from QWeather API with JWT authentication
 * Two-step process:
 * 1. Convert lat/lon to location ID using Geo API
 * 2. Fetch tide data using location ID
 */

import { generateJWT } from './jwt'

const GEO_ENDPOINT = '/geo/v2/poi/lookup'
const TIDE_ENDPOINT = '/v7/ocean/tide'
const CACHE_PREFIX = 'tide_cache_'
const CACHE_EXPIRY_DAYS = 30

/**
 * Generate cache key for tide data
 */
const getCacheKey = (locationId, date) => {
  return `${CACHE_PREFIX}${locationId}_${date}`
}

/**
 * Get cached tide data from localStorage
 */
const getCachedTideData = (locationId, date) => {
  try {
    const cacheKey = getCacheKey(locationId, date)
    const cachedData = localStorage.getItem(cacheKey)

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData)
      const now = Date.now()
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000

      // Check if cache is still valid
      if (now - timestamp < expiryTime) {
        return data
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (error) {
    // Silently fail if cache read fails
  }

  return null
}

/**
 * Save tide data to localStorage cache
 */
const saveTideDataToCache = (locationId, date, data) => {
  try {
    const cacheKey = getCacheKey(locationId, date)
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    // Silently fail if cache save fails
  }
}

/**
 * Get location ID from coordinates using Geo API
 */
const getLocationId = async (lat, lon, projectId, privateKey, keyId) => {
  try {
    // Generate JWT token
    const token = await generateJWT(projectId, privateKey, keyId)

    // Build request URL for geo lookup
    // Use window.location.origin to get the current host (works with both localhost and network IP)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'
    // Format coordinates with 2 decimal places precision
    const location = `${parseFloat(lon).toFixed(2)},${parseFloat(lat).toFixed(2)}`
    const url = `${baseUrl}${GEO_ENDPOINT}?location=${location}&type=TSTA`

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Geo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Extract location ID from response
    if (data.poi && data.poi.length > 0) {
      const locationId = data.poi[0].id
      const locationName = data.poi[0].name
      return { locationId, locationName }
    } else {
      throw new Error('No location found for the given coordinates')
    }
  } catch (error) {
    throw error
  }
}

/**
 * Fetch tide data from QWeather API using location ID
 */
const fetchTideData = async (options) => {
  const { lat, lon, projectId, privateKey, keyId, date } = options

  try {
    // Step 1: Get location ID from coordinates
    const { locationId, locationName } = await getLocationId(lat, lon, projectId, privateKey, keyId)

    // Step 2: Check cache first
    const cachedData = getCachedTideData(locationId, date)
    if (cachedData) {
      cachedData.locationName = locationName
      cachedData.locationId = locationId
      cachedData.fromCache = true
      return cachedData
    }

    // Step 3: Generate JWT token for tide API
    const token = await generateJWT(projectId, privateKey, keyId)

    // Build request URL for tide data
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'
    let url = `${baseUrl}${TIDE_ENDPOINT}?location=${locationId}`
    if (date) {
      url += `&date=${date}`
    }

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Tide API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Step 4: Save to cache
    saveTideDataToCache(locationId, date, data)

    // Add location info to response
    data.locationName = locationName
    data.locationId = locationId
    data.fromCache = false

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Fetch tide data directly using location ID (skips POI lookup)
 */
const fetchTideDataByLocationId = async (options) => {
  const { locationId, locationName, projectId, privateKey, keyId, date } = options

  try {
    // Step 1: Check cache first
    const cachedData = getCachedTideData(locationId, date)
    if (cachedData) {
      cachedData.locationName = locationName
      cachedData.locationId = locationId
      cachedData.fromCache = true
      return cachedData
    }

    // Step 2: Generate JWT token for tide API
    const token = await generateJWT(projectId, privateKey, keyId)

    // Build request URL for tide data
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174'
    let url = `${baseUrl}${TIDE_ENDPOINT}?location=${locationId}`
    if (date) {
      url += `&date=${date}`
    }

    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Tide API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Step 3: Save to cache
    saveTideDataToCache(locationId, date, data)

    // Add location info to response
    data.locationName = locationName
    data.locationId = locationId
    data.fromCache = false

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Get tide data with provided credentials
 */
const getTideData = async (lat, lon, projectId, privateKey, keyId, date) => {
  return fetchTideData({
    lat,
    lon,
    projectId,
    privateKey,
    keyId,
    date
  })
}

/**
 * Get tide data directly using location ID
 */
const getTideDataByLocationId = async (locationId, locationName, projectId, privateKey, keyId, date) => {
  return fetchTideDataByLocationId({
    locationId,
    locationName,
    projectId,
    privateKey,
    keyId,
    date
  })
}

export { fetchTideData, getTideData, getLocationId, getTideDataByLocationId }
