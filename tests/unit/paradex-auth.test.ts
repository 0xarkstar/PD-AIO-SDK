/**
 * Paradex Auth Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ParadexAuth } from '../../src/adapters/paradex/auth.js';

describe('ParadexAuth', () => {
  describe('constructor', () => {
    it('should initialize with API key', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      expect(auth).toBeDefined();
    });

    it('should initialize with stark private key', () => {
      // Using a valid StarkNet private key format
      const auth = new ParadexAuth({ 
        starkPrivateKey: '0x' + '1'.repeat(64)
      });
      expect(auth).toBeDefined();
    });

    it('should throw if neither apiKey nor starkPrivateKey provided', () => {
      expect(() => new ParadexAuth({})).toThrow(
        'Either apiKey or starkPrivateKey must be provided'
      );
    });

    it('should accept testnet option', () => {
      const auth = new ParadexAuth({ 
        apiKey: 'test-key',
        testnet: true 
      });
      expect(auth).toBeDefined();
    });

    it('should accept both apiKey and apiSecret', () => {
      const auth = new ParadexAuth({ 
        apiKey: 'test-key',
        apiSecret: 'test-secret' 
      });
      expect(auth).toBeDefined();
    });
  });

  describe('verify', () => {
    it('should return true with valid API key', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const result = await auth.verify();
      expect(result).toBe(true);
    });

    it('should return true with valid stark private key', async () => {
      const auth = new ParadexAuth({ 
        starkPrivateKey: '0x' + '1'.repeat(64)
      });
      const result = await auth.verify();
      expect(result).toBe(true);
    });
  });

  describe('getHeaders', () => {
    it('should include Content-Type header', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const headers = auth.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include X-API-KEY header when apiKey provided', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const headers = auth.getHeaders();
      expect(headers['X-API-KEY']).toBe('test-api-key');
    });

    it('should not include X-API-KEY when no apiKey', () => {
      const auth = new ParadexAuth({ 
        starkPrivateKey: '0x' + '1'.repeat(64)
      });
      const headers = auth.getHeaders();
      expect(headers['X-API-KEY']).toBeUndefined();
    });
  });

  describe('JWT token management', () => {
    let auth: ParadexAuth;

    beforeEach(() => {
      auth = new ParadexAuth({ apiKey: 'test-api-key' });
    });

    it('should return undefined when no JWT token set', () => {
      expect(auth.getJWTToken()).toBeUndefined();
    });

    it('should set and get JWT token', () => {
      auth.setJWTToken({
        access_token: 'jwt-token-123',
        expires_in: 3600, // 1 hour
        token_type: 'Bearer',
      });
      expect(auth.getJWTToken()).toBe('jwt-token-123');
    });

    it('should clear JWT token', () => {
      auth.setJWTToken({
        access_token: 'jwt-token-123',
        expires_in: 3600,
        token_type: 'Bearer',
      });
      auth.clearJWTToken();
      expect(auth.getJWTToken()).toBeUndefined();
    });

    it('should return undefined for expired JWT token', () => {
      auth.setJWTToken({
        access_token: 'jwt-token-123',
        expires_in: -1, // Already expired
        token_type: 'Bearer',
      });
      expect(auth.getJWTToken()).toBeUndefined();
    });

    it('should include Authorization header when JWT token set', () => {
      auth.setJWTToken({
        access_token: 'jwt-token-123',
        expires_in: 3600,
        token_type: 'Bearer',
      });
      const headers = auth.getHeaders();
      expect(headers['Authorization']).toBe('Bearer jwt-token-123');
    });
  });

  describe('StarkNet key management', () => {
    it('should return undefined for getStarkPrivateKey when not set', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      expect(auth.getStarkPrivateKey()).toBeUndefined();
    });

    it('should return stark private key when set', () => {
      const starkKey = '0x' + '1'.repeat(64);
      const auth = new ParadexAuth({ starkPrivateKey: starkKey });
      expect(auth.getStarkPrivateKey()).toBe(starkKey);
    });

    it('should return undefined for deriveStarkPublicKey when no stark key', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      expect(auth.deriveStarkPublicKey()).toBeUndefined();
    });

    it('should return undefined for getAddress when no stark key', () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      expect(auth.getAddress()).toBeUndefined();
    });
  });

  describe('sign', () => {
    it('should add Content-Type header', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const request = await auth.sign({
        method: 'GET',
        path: '/markets',
      });
      expect(request.headers?.['Content-Type']).toBe('application/json');
    });

    it('should add X-API-KEY header', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const request = await auth.sign({
        method: 'GET',
        path: '/markets',
      });
      expect(request.headers?.['X-API-KEY']).toBe('test-api-key');
    });

    it('should add X-Timestamp header', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const request = await auth.sign({
        method: 'GET',
        path: '/markets',
      });
      expect(request.headers?.['X-Timestamp']).toBeDefined();
    });

    it('should include Authorization header when JWT token set', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      auth.setJWTToken({
        access_token: 'jwt-token-123',
        expires_in: 3600,
        token_type: 'Bearer',
      });
      const request = await auth.sign({
        method: 'GET',
        path: '/markets',
      });
      expect(request.headers?.['Authorization']).toBe('Bearer jwt-token-123');
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers for GET request', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const headers = await auth.getAuthHeaders('GET', '/markets');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-API-KEY']).toBe('test-api-key');
    });

    it('should return headers for POST request', async () => {
      const auth = new ParadexAuth({ apiKey: 'test-api-key' });
      const headers = await auth.getAuthHeaders('POST', '/markets', { test: 'data' });
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
