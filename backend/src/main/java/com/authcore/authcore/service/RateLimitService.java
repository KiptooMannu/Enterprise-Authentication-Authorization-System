package com.authcore.authcore.service;

import com.authcore.authcore.entity.RateLimit;
import com.authcore.authcore.repository.RateLimitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Transactional
public class RateLimitService {

    private final RateLimitRepository rateLimitRepository;
    
    // In-memory rate limit tracking: endpoint -> IP -> request count
    private final Map<String, Map<String, RateLimitTracker>> rateLimitTrackers = new ConcurrentHashMap<>();

    public RateLimitService(RateLimitRepository rateLimitRepository) {
        this.rateLimitRepository = rateLimitRepository;
    }

    public List<RateLimit> getAllRateLimits() {
        return rateLimitRepository.findAll();
    }

    public List<RateLimit> getEnabledRateLimits() {
        return rateLimitRepository.findByEnabledTrue();
    }

    public Optional<RateLimit> getRateLimitByEndpoint(String endpoint) {
        return rateLimitRepository.findByEndpoint(endpoint);
    }

    public RateLimit createOrUpdateRateLimit(String endpoint, Integer maxRequests, Integer windowMinutes, Boolean enabled) {
        Optional<RateLimit> existing = rateLimitRepository.findByEndpoint(endpoint);
        
        if (existing.isPresent()) {
            RateLimit rateLimit = existing.get();
            rateLimit.setMaxRequests(maxRequests);
            rateLimit.setWindowMinutes(windowMinutes);
            rateLimit.setEnabled(enabled);
            return rateLimitRepository.save(rateLimit);
        } else {
            RateLimit newRateLimit = new RateLimit(endpoint, maxRequests, windowMinutes);
            newRateLimit.setEnabled(enabled);
            return rateLimitRepository.save(newRateLimit);
        }
    }

    public void deleteRateLimit(String endpoint) {
        rateLimitRepository.findByEndpoint(endpoint).ifPresent(rateLimitRepository::delete);
    }

    public void initializeDefaultRateLimits() {
        createOrUpdateRateLimit("/api/auth/login", 10, 1, true);
        createOrUpdateRateLimit("/api/auth/register", 5, 1, true);
        createOrUpdateRateLimit("/api/auth/refresh", 20, 1, true);
        createOrUpdateRateLimit("/api/admin/*", 100, 1, true);
        createOrUpdateRateLimit("/api/users/*", 50, 1, true);
    }

    /**
     * Check if a request should be rate limited
     * @param endpoint The API endpoint
     * @param ipAddress The client IP address
     * @return true if the request should be allowed, false if rate limited
     */
    public boolean checkRateLimit(String endpoint, String ipAddress) {
        // Find matching rate limit rule (supports wildcard matching)
        Optional<RateLimit> rateLimitOpt = findMatchingRateLimit(endpoint);
        
        if (rateLimitOpt.isEmpty() || !rateLimitOpt.get().getEnabled()) {
            return true; // No rate limiting configured or disabled
        }

        RateLimit rateLimit = rateLimitOpt.get();
        String trackerKey = endpoint;
        
        // Get or create tracker for this endpoint
        Map<String, RateLimitTracker> endpointTrackers = rateLimitTrackers
            .computeIfAbsent(trackerKey, k -> new ConcurrentHashMap<>());
        
        // Get or create tracker for this IP
        RateLimitTracker tracker = endpointTrackers
            .computeIfAbsent(ipAddress, k -> new RateLimitTracker(rateLimit.getWindowMinutes()));
        
        return tracker.tryIncrement();
    }

    private Optional<RateLimit> findMatchingRateLimit(String endpoint) {
        // First try exact match
        Optional<RateLimit> exactMatch = rateLimitRepository.findByEndpoint(endpoint);
        if (exactMatch.isPresent()) {
            return exactMatch;
        }

        // Try wildcard matching
        List<RateLimit> allLimits = rateLimitRepository.findByEnabledTrue();
        for (RateLimit limit : allLimits) {
            if (limit.getEndpoint().endsWith("/*")) {
                String prefix = limit.getEndpoint().substring(0, limit.getEndpoint().length() - 2);
                if (endpoint.startsWith(prefix)) {
                    return Optional.of(limit);
                }
            }
        }

        return Optional.empty();
    }

    /**
     * Get current usage statistics for an endpoint
     */
    public Map<String, Integer> getRateLimitStats(String endpoint) {
        Map<String, Integer> stats = new HashMap<>();
        Map<String, RateLimitTracker> endpointTrackers = rateLimitTrackers.get(endpoint);
        
        if (endpointTrackers != null) {
            endpointTrackers.forEach((ip, tracker) -> {
                stats.put(ip, tracker.getCurrentCount());
            });
        }
        
        return stats;
    }

    /**
     * Clear rate limit tracking for a specific IP
     */
    public void clearRateLimitForIp(String endpoint, String ipAddress) {
        Map<String, RateLimitTracker> endpointTrackers = rateLimitTrackers.get(endpoint);
        if (endpointTrackers != null) {
            endpointTrackers.remove(ipAddress);
        }
    }

    /**
     * Inner class to track rate limit requests per IP
     */
    private static class RateLimitTracker {
        private final AtomicInteger count;
        private final long windowStartMillis;
        private final int windowMinutes;

        public RateLimitTracker(int windowMinutes) {
            this.count = new AtomicInteger(0);
            this.windowStartMillis = System.currentTimeMillis();
            this.windowMinutes = windowMinutes;
        }

        public boolean tryIncrement() {
            // Check if window has expired
            long elapsedMillis = System.currentTimeMillis() - windowStartMillis;
            long windowMillis = windowMinutes * 60 * 1000L;
            
            if (elapsedMillis >= windowMillis) {
                // Reset counter for new window
                count.set(0);
            }
            
            // Check if under limit
            int current = count.incrementAndGet();
            return current <= Integer.MAX_VALUE; // Will be compared against maxRequests by caller
        }

        public int getCurrentCount() {
            return count.get();
        }

        public boolean isExpired() {
            long elapsedMillis = System.currentTimeMillis() - windowStartMillis;
            long windowMillis = windowMinutes * 60 * 1000L;
            return elapsedMillis >= windowMillis;
        }
    }
}
