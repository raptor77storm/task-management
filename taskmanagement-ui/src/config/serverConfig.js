// src/config/serverConfig.js
/**
 * Server Configuration
 * 
 * This module handles API endpoint configuration for both development and production deployments.
 * For local server/VM deployments, the backend IP is auto-detected or can be manually configured.
 */

class ServerConfig {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.apiBase = this.getApiBase();
  }

  /**
   * Determines the API base URL based on deployment environment
   */
  getApiBase() {
    // Check for environment variable (set during build or at runtime)
    if (process.env.REACT_APP_API_BASE) {
      return process.env.REACT_APP_API_BASE;
    }

    // Check localStorage (user can override via settings page)
    const storedApiBase = localStorage.getItem('api_base');
    if (storedApiBase) {
      return storedApiBase;
    }

    // In development, use localhost
    if (this.isDevelopment) {
      return 'http://localhost:5267/api';
    }

    // In production, detect from current hostname
    // This allows the app to work when deployed to a local server/VM
    const protocol = window.location.protocol; // http: or https:
    const hostname = window.location.hostname; // The server's IP or domain
    const port = this.getBackendPort();

    return `${protocol}//${hostname}:${port}/api`;
  }

  /**
   * Gets the backend port (configurable, defaults to 5267)
   */
  getBackendPort() {
    const storedPort = localStorage.getItem('api_port');
    if (storedPort) {
      return storedPort;
    }
    // Default ASP.NET Core port
    return process.env.REACT_APP_API_PORT || '5267';
  }

  /**
   * Updates the API base URL at runtime (for settings page)
   */
  setApiBase(apiBase) {
    localStorage.setItem('api_base', apiBase);
    this.apiBase = apiBase;
  }

  /**
   * Updates the backend port at runtime
   */
  setBackendPort(port) {
    localStorage.setItem('api_port', port);
  }

  /**
   * Resets to default configuration
   */
  reset() {
    localStorage.removeItem('api_base');
    localStorage.removeItem('api_port');
    this.apiBase = this.getApiBase();
  }

  /**
   * Gets the current configuration info (for debugging)
   */
  getInfo() {
    return {
      apiBase: this.apiBase,
      isDevelopment: this.isDevelopment,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
    };
  }
}

export default new ServerConfig();
