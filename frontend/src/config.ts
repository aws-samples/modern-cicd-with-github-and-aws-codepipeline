interface Config {
  apiUrl: string;
  hotelName: string;
}

/**
 * Get environment variable with fallback to default value
 * @param key - Environment variable key
 * @param defaultValue - Default value if env var is not set or empty
 * @returns The environment variable value or default
 */
export const getEnvVar = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key];
  return value !== undefined && value !== '' ? value : defaultValue;
};

/**
 * Load configuration from environment variables
 * @param envVars - Object containing environment variables
 * @returns Configuration object
 */
export const loadConfig = (envVars: Record<string, string | undefined>): Config => {
  const getVar = (key: string, defaultValue: string): string => {
    const value = envVars[key];
    return value !== undefined && value !== '' ? value : defaultValue;
  };

  return {
    apiUrl: getVar('VITE_API_URL', 'http://localhost:3000'),
    hotelName: getVar('VITE_HOTEL_NAME', 'Hotel Yorba'),
  };
};

export const config: Config = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000'),
  hotelName: getEnvVar('VITE_HOTEL_NAME', 'Hotel Yorba'),
};

export default config;
