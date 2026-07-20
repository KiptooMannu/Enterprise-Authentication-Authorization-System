package com.authcore.authcore.service;

import com.authcore.authcore.entity.LoginLocation;
import com.authcore.authcore.repository.LoginLocationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LoginLocationService {

    private static final Logger logger = LoggerFactory.getLogger(LoginLocationService.class);
    private static final double NEW_LOCATION_THRESHOLD_KM = 100.0;

    private final LoginLocationRepository loginLocationRepository;
    private final ReverseGeocodingService reverseGeocodingService;

    public LoginLocationService(LoginLocationRepository loginLocationRepository, 
                              ReverseGeocodingService reverseGeocodingService) {
        this.loginLocationRepository = loginLocationRepository;
        this.reverseGeocodingService = reverseGeocodingService;
    }

    /**
     * Record a login location with GPS coordinates
     */
    public LoginLocation recordLoginLocation(Long userId, Long sessionId, 
                                            Double latitude, Double longitude,
                                            Double accuracy, Double altitude, 
                                            Double heading, Double speed,
                                            HttpServletRequest request) {
        
        LoginLocation loginLocation = new LoginLocation();
        loginLocation.setUserId(userId);
        loginLocation.setSessionId(sessionId);
        
        // GPS coordinates
        if (latitude != null && longitude != null) {
            loginLocation.setLatitude(latitude);
            loginLocation.setLongitude(longitude);
            loginLocation.setAccuracy(accuracy);
            loginLocation.setAltitude(altitude);
            loginLocation.setHeading(heading);
            loginLocation.setSpeed(speed);
            loginLocation.setLocationSource(LoginLocation.LocationSource.GPS);
            
            // Perform reverse geocoding
            try {
                Map<String, String> address = reverseGeocodingService.reverseGeocode(latitude, longitude);
                if (!address.isEmpty()) {
                    loginLocation.setCountry(address.get("country"));
                    loginLocation.setCounty(address.get("county"));
                    loginLocation.setCity(address.get("city"));
                    loginLocation.setStreet(address.get("street"));
                    loginLocation.setFormattedAddress(address.get("formattedAddress"));
                }
            } catch (Exception e) {
                logger.error("Error reverse geocoding location: {}", e.getMessage());
            }
        } else {
            // Fallback to IP-based location
            loginLocation.setLocationSource(LoginLocation.LocationSource.IP);
            loginLocation.setIpAddress(getClientIpAddress(request));
        }

        // Device information
        loginLocation.setIpAddress(getClientIpAddress(request));
        loginLocation.setUserAgent(request.getHeader("User-Agent"));
        
        // Parse user agent for device info
        parseUserAgent(request.getHeader("User-Agent"), loginLocation);
        
        loginLocation.setLoginTime(Instant.now());
        
        LoginLocation saved = loginLocationRepository.save(loginLocation);
        logger.info("Recorded login location for user {}: source={}, city={}, country={}", 
            userId, loginLocation.getLocationSource(), loginLocation.getCity(), loginLocation.getCountry());
        
        return saved;
    }

    /**
     * Record a login location when GPS permission was denied
     */
    public LoginLocation recordLoginLocationWithoutGPS(Long userId, Long sessionId, 
                                                      HttpServletRequest request) {
        return recordLoginLocation(userId, sessionId, null, null, null, null, null, null, request);
    }

    /**
     * Check if this is a new location for the user (security check)
     */
    public boolean isNewLocation(Long userId, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false; // Can't determine if new location without GPS
        }

        // Get user's previous login locations
        List<LoginLocation> previousLocations = loginLocationRepository
            .findByUserIdOrderByLoginTimeDesc(userId);

        if (previousLocations.isEmpty()) {
            return true; // First login is always "new"
        }

        // Check if any previous location is within threshold
        for (LoginLocation location : previousLocations) {
            if (location.getLatitude() != null && location.getLongitude() != null) {
                double distance = reverseGeocodingService.calculateDistance(
                    latitude, longitude,
                    location.getLatitude(), location.getLongitude()
                );
                
                if (distance < NEW_LOCATION_THRESHOLD_KM) {
                    return false; // Found a location within threshold
                }
            }
        }

        return true; // No previous locations within threshold
    }

    /**
     * Check if this is a new city for the user
     */
    public boolean isNewCity(Long userId, String city) {
        if (city == null || city.isEmpty()) {
            return false;
        }

        List<String> previousCities = loginLocationRepository.findDistinctCitiesByUserId(userId);
        return !previousCities.contains(city);
    }

    /**
     * Check if this is a new country for the user
     */
    public boolean isNewCountry(Long userId, String country) {
        if (country == null || country.isEmpty()) {
            return false;
        }

        List<String> previousCountries = loginLocationRepository.findDistinctCountriesByUserId(userId);
        return !previousCountries.contains(country);
    }

    /**
     * Get user's login locations
     */
    public List<LoginLocation> getUserLoginLocations(Long userId) {
        return loginLocationRepository.findByUserIdOrderByLoginTimeDesc(userId);
    }

    /**
     * Get user's most recent login location
     */
    public LoginLocation getMostRecentLoginLocation(Long userId) {
        return loginLocationRepository.findFirstByUserIdOrderByLoginTimeDesc(userId).orElse(null);
    }

    /**
     * Update logout time for a session
     */
    public void recordLogout(Long sessionId) {
        List<LoginLocation> locations = loginLocationRepository.findBySessionId(sessionId);
        for (LoginLocation location : locations) {
            location.setLogoutTime(Instant.now());
            loginLocationRepository.save(location);
        }
    }

    /**
     * Parse user agent string to extract browser, OS, and device type
     */
    private void parseUserAgent(String userAgent, LoginLocation loginLocation) {
        if (userAgent == null) {
            return;
        }

        String ua = userAgent.toLowerCase();

        // Detect browser
        if (ua.contains("chrome")) {
            loginLocation.setBrowser("Chrome");
        } else if (ua.contains("firefox")) {
            loginLocation.setBrowser("Firefox");
        } else if (ua.contains("safari") && !ua.contains("chrome")) {
            loginLocation.setBrowser("Safari");
        } else if (ua.contains("edge")) {
            loginLocation.setBrowser("Edge");
        } else if (ua.contains("opera")) {
            loginLocation.setBrowser("Opera");
        } else {
            loginLocation.setBrowser("Unknown");
        }

        // Detect operating system
        if (ua.contains("windows")) {
            loginLocation.setOperatingSystem("Windows");
        } else if (ua.contains("mac os x") || ua.contains("macos")) {
            loginLocation.setOperatingSystem("macOS");
        } else if (ua.contains("linux")) {
            loginLocation.setOperatingSystem("Linux");
        } else if (ua.contains("android")) {
            loginLocation.setOperatingSystem("Android");
        } else if (ua.contains("ios") || ua.contains("iphone") || ua.contains("ipad")) {
            loginLocation.setOperatingSystem("iOS");
        } else {
            loginLocation.setOperatingSystem("Unknown");
        }

        // Detect device type
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone")) {
            loginLocation.setDeviceType("Mobile");
        } else if (ua.contains("tablet") || ua.contains("ipad")) {
            loginLocation.setDeviceType("Tablet");
        } else {
            loginLocation.setDeviceType("Desktop");
        }
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
