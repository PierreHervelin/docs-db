import '@testing-library/jest-dom'
import { randomUUID } from 'node:crypto'
import { TextDecoder, TextEncoder } from 'node:util'

// Polyfill for TextEncoder/TextDecoder in jsdom environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for crypto.randomUUID
if (!global.crypto) {
  global.crypto = {}
}
global.crypto.randomUUID = randomUUID
