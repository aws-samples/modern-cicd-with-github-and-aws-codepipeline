import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { loadConfig } from './config';

/**
 * Feature: serverless-migration, Property 6: Configuration loading from environment
 * Validates: Requirements 4.4, 9.1
 * 
 * For any set of environment variables (VITE_API_URL, VITE_HOTEL_NAME),
 * when the application starts, it should load and use these values correctly.
 */
describe('Property 6: Configuration loading from environment', () => {
  it('should load configuration from any valid environment variables', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary API URLs (http or https)
        fc.webUrl({ validSchemes: ['http', 'https'] }),
        // Generate arbitrary hotel names (non-empty strings)
        fc.string({ minLength: 1, maxLength: 100 }),
        (apiUrl, hotelName) => {
          // Create environment variables object
          const envVars = {
            VITE_API_URL: apiUrl,
            VITE_HOTEL_NAME: hotelName,
          };

          // Load configuration
          const config = loadConfig(envVars);

          // Property: Configuration should contain the exact values from environment
          expect(config.apiUrl).toBe(apiUrl);
          expect(config.hotelName).toBe(hotelName);
          
          // Property: Configuration values should be non-empty strings
          expect(typeof config.apiUrl).toBe('string');
          expect(typeof config.hotelName).toBe('string');
          expect(config.apiUrl.length).toBeGreaterThan(0);
          expect(config.hotelName.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('should handle empty string environment variables by using defaults', () => {
    fc.assert(
      fc.property(
        // Generate combinations of empty/undefined values
        fc.constantFrom('', undefined),
        fc.constantFrom('', undefined),
        (apiUrlValue, hotelNameValue) => {
          const envVars = {
            VITE_API_URL: apiUrlValue,
            VITE_HOTEL_NAME: hotelNameValue,
          };

          const config = loadConfig(envVars);

          // Property: Empty or undefined env vars should result in default values
          expect(config.apiUrl).toBe('http://localhost:3000');
          expect(config.hotelName).toBe('Hotel Yorba');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle partial environment variable sets', () => {
    fc.assert(
      fc.property(
        fc.webUrl({ validSchemes: ['http', 'https'] }),
        (apiUrl) => {
          // Only set API URL, leave hotel name undefined
          const envVars = {
            VITE_API_URL: apiUrl,
            VITE_HOTEL_NAME: undefined,
          };

          const config = loadConfig(envVars);

          // Property: Set values should be used, missing values should use defaults
          expect(config.apiUrl).toBe(apiUrl);
          expect(config.hotelName).toBe('Hotel Yorba');
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (hotelName) => {
          // Only set hotel name, leave API URL undefined
          const envVars = {
            VITE_API_URL: undefined,
            VITE_HOTEL_NAME: hotelName,
          };

          const config = loadConfig(envVars);

          // Property: Set values should be used, missing values should use defaults
          expect(config.apiUrl).toBe('http://localhost:3000');
          expect(config.hotelName).toBe(hotelName);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: serverless-migration, Property 7: Configuration defaults
 * Validates: Requirements 9.4
 * 
 * For any missing environment variable, when the application starts,
 * it should use sensible default values.
 */
describe('Property 7: Configuration defaults', () => {
  it('should provide default values when no environment variables are set', () => {
    fc.assert(
      fc.property(
        fc.constant({}), // Empty environment
        (envVars) => {
          const config = loadConfig(envVars);

          // Property: Missing env vars should result in sensible defaults
          expect(config.apiUrl).toBe('http://localhost:3000');
          expect(config.hotelName).toBe('Hotel Yorba');
          
          // Property: Defaults should be valid values
          expect(config.apiUrl).toMatch(/^https?:\/\//);
          expect(config.hotelName.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
