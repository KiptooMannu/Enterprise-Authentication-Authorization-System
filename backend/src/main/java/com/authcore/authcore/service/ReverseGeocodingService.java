package com.authcore.authcore.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ReverseGeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(ReverseGeocodingService.class);
    private static final String NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/reverse";
    private static final String USER_AGENT = "AuthCore/1.0";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ReverseGeocodingService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Convert latitude and longitude to a readable address using OpenStreetMap Nominatim
     * @param latitude Latitude
     * @param longitude Longitude
     * @return Map containing address components
     */
    public Map<String, String> reverseGeocode(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            logger.warn("Latitude or longitude is null, skipping reverse geocoding");
            return new HashMap<>();
        }

        try {
            String url = String.format("%s?format=json&lat=%f&lon=%f&zoom=18&addressdetails=1", 
                NOMINATIM_API_URL, latitude, longitude);
            
            logger.debug("Calling Nominatim API: {}", url);
            
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null) {
                logger.warn("Null response from Nominatim API");
                return new HashMap<>();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode address = root.path("address");

            Map<String, String> addressComponents = new HashMap<>();
            
            // Extract address components
            if (address.has("country")) {
                addressComponents.put("country", address.get("country").asText());
            }
            if (address.has("state") || address.has("county")) {
                addressComponents.put("county", 
                    address.has("state") ? address.get("state").asText() : address.get("county").asText());
            }
            if (address.has("city") || address.has("town") || address.has("village")) {
                addressComponents.put("city", 
                    address.has("city") ? address.get("city").asText() : 
                    (address.has("town") ? address.get("town").asText() : address.get("village").asText()));
            }
            if (address.has("postcode")) {
                addressComponents.put("postalCode", address.get("postcode").asText());
            }
            if (address.has("road") || address.has("street")) {
                addressComponents.put("street", 
                    address.has("road") ? address.get("road").asText() : address.get("street").asText());
            }

            // Get formatted address if available
            if (root.has("display_name")) {
                addressComponents.put("formattedAddress", root.get("display_name").asText());
            }

            logger.debug("Reverse geocoding successful for lat={}, lon={}", latitude, longitude);
            return addressComponents;

        } catch (Exception e) {
            logger.error("Error during reverse geocoding for lat={}, lon={}: {}", 
                latitude, longitude, e.getMessage(), e);
            return new HashMap<>();
        }
    }

    /**
     * Calculate distance between two coordinates in kilometers using Haversine formula
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}
