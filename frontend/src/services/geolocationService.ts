export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Get current user location using HTML5 Geolocation API
   * @param timeout - Timeout in milliseconds (default: 10000)
   * @returns Promise with geolocation data or null if failed
   */
  public async getCurrentLocation(timeout: number = 10000): Promise<GeolocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeout
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const data: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          console.log('Geolocation acquired:', data);
          resolve(data);
        },
        (error) => {
          console.warn('Geolocation error:', this.getErrorMessage(error));
          resolve(null);
        },
        options
      );
    });
  }

  /**
   * Get current location with fallback to IP-based location
   * @returns Promise with geolocation data or null if completely failed
   */
  public async getLocationWithFallback(): Promise<GeolocationData | null> {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        return location;
      }
    } catch (error) {
      console.warn('Geolocation failed, will use IP-based location only');
    }
    return null;
  }

  /**
   * Check if geolocation is supported
   */
  public isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request permission for geolocation
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const result = await this.getCurrentLocation(5000);
      return result !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get human-readable error message from geolocation error code
   */
  private getErrorMessage(error: GeolocationError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'User denied the request for geolocation';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable';
      case error.TIMEOUT:
        return 'The request to get user location timed out';
      default:
        return 'An unknown error occurred';
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers using Haversine formula
   */
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Generate Google Maps URL from coordinates
   */
  public static getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://maps.google.com/?q=${latitude},${longitude}`;
  }

  /**
   * Generate OpenStreetMap URL from coordinates
   */
  public static getOpenStreetMapUrl(latitude: number, longitude: number): string {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
  }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();
