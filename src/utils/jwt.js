/**
 * JWT Token Generation Utility for Web
 * Uses the official jose library for EdDSA JWT signing
 */

import { SignJWT, importPKCS8 } from 'jose'

console.log('JWT module loaded - jose imported successfully')
console.log('Global crypto available:', typeof globalThis.crypto !== 'undefined')
console.log('Window crypto available:', typeof window !== 'undefined' && typeof window.crypto !== 'undefined')

/**
 * Generate JWT token for QWeather API using jose library
 * @param {string} projectId - QWeather project ID
 * @param {string} privateKeyPem - Private key in PEM format
 * @param {string} keyId - Key ID
 * @returns {Promise<string>} JWT token
 */
const generateJWT = async (projectId, privateKeyPem, keyId) => {
  try {
    console.log('generateJWT called with projectId:', projectId)
    console.log('Importing PKCS8 key...')
    
    // Ensure crypto is available
    if (!globalThis.crypto && typeof window !== 'undefined') {
      globalThis.crypto = window.crypto
    }
    
    console.log('crypto.subtle available:', typeof globalThis.crypto?.subtle !== 'undefined')
    
    // Import the private key using jose
    const privateKey = await importPKCS8(privateKeyPem, 'EdDSA')
    console.log('Private key imported successfully')

    // Create JWT header
    const customHeader = {
      alg: 'EdDSA',
      kid: keyId
    }

    // Create JWT payload
    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + 900
    const customPayload = {
      sub: projectId,
      iat: iat,
      exp: exp
    }

    console.log('Signing JWT...')
    // Sign and return JWT
    const token = await new SignJWT(customPayload)
      .setProtectedHeader(customHeader)
      .sign(privateKey)

    console.log('JWT signed successfully:', token.substring(0, 50) + '...')
    return token
  } catch (error) {
    console.error('JWT generation error:', error)
    console.error('Error stack:', error.stack)
    throw error
  }
}

export { generateJWT }
