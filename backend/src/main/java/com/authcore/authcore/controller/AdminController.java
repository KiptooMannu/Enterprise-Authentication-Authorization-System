package com.authcore.authcore.controller;

import com.authcore.authcore.dto.UserResponse;
import com.authcore.authcore.entity.AuditLog;
import com.authcore.authcore.entity.RefreshToken;
import com.authcore.authcore.entity.RateLimit;
import com.authcore.authcore.entity.LoginLocation;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.service.AuditLogService;
import com.authcore.authcore.service.RefreshTokenService;
import com.authcore.authcore.service.UserService;
import com.authcore.authcore.service.SystemConfigService;
import com.authcore.authcore.service.RateLimitService;
import com.authcore.authcore.service.LoginLocationService;
import com.authcore.authcore.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AuditLogService auditLogService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SystemConfigService systemConfigService;
    private final RateLimitService rateLimitService;
    private final LoginLocationService loginLocationService;

    public AdminController(UserService userService, AuditLogService auditLogService, RefreshTokenRepository refreshTokenRepository, SystemConfigService systemConfigService, RateLimitService rateLimitService, LoginLocationService loginLocationService) {
        this.userService = userService;
        this.auditLogService = auditLogService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.systemConfigService = systemConfigService;
        this.rateLimitService = rateLimitService;
        this.loginLocationService = loginLocationService;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.findAllUsers().stream()
            .map(this::toUserResponse)
            .collect(Collectors.toList());
    }

    @PutMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable Long id, @RequestParam UserRole role, Authentication authentication, HttpServletRequest httpRequest) {
        UserEntity targetUser = userService.findById(id);
        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        
        UserEntity user = userService.updateUserRole(id, role);
        auditLogService.logEvent(adminUser, "ROLE_UPDATED", "User", id, ipAddress, 
            "Updated role for user " + targetUser.getEmail() + " to " + role);
        return toUserResponse(user);
    }

    @PutMapping("/users/{id}/status")
    public UserResponse updateStatus(@PathVariable Long id, @RequestParam boolean enabled, Authentication authentication, HttpServletRequest httpRequest) {
        UserEntity targetUser = userService.findById(id);
        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        
        UserEntity user = userService.updateUserStatus(id, enabled);
        auditLogService.logEvent(adminUser, "STATUS_UPDATED", "User", id, ipAddress, 
            "Updated status for user " + targetUser.getEmail() + " to " + (enabled ? "enabled" : "disabled"));
        return toUserResponse(user);
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> getAuditLogs() {
        return auditLogService.getAllAuditLogs();
    }

    @GetMapping("/audit-logs/user/{userId}")
    public List<AuditLog> getUserAuditLogs(@PathVariable Long userId) {
        UserEntity user = userService.findById(userId);
        return auditLogService.getUserAuditLogs(user);
    }

    @GetMapping("/sessions")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllSessions() {
        List<RefreshToken> tokens = refreshTokenRepository.findAll();
        return tokens.stream().map(t -> {
            Map<String, Object> session = new java.util.HashMap<>();
            session.put("id", t.getId());
            try {
                if (t.getUser() != null) {
                    session.put("userId", t.getUser().getId());
                    session.put("username", t.getUser().getUsername());
                } else {
                    session.put("userId", null);
                    session.put("username", "unknown");
                }
            } catch (Exception e) {
                session.put("userId", null);
                session.put("username", "unknown");
            }
            session.put("token", t.getToken());
            session.put("ipAddress", t.getIpAddress() != null ? t.getIpAddress() : "unknown");
            session.put("userAgent", t.getUserAgent() != null ? t.getUserAgent() : "unknown");
            session.put("createdAt", t.getCreatedAt());
            session.put("expiryDate", t.getExpiryDate());
            session.put("isActive", t.getExpiryDate().isAfter(java.time.Instant.now()));
            return session;
        }).collect(Collectors.toList());
    }

    @DeleteMapping("/sessions/{id}")
    public Map<String, String> revokeSession(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        RefreshToken token = refreshTokenRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        refreshTokenRepository.deleteById(id);
        
        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        auditLogService.logEvent(adminUser, "SESSION_REVOKED", "RefreshToken", id, ipAddress,
            "Revoked session for user " + (token.getUser() != null ? token.getUser().getUsername() : "unknown"));
        
        return Map.of("status", "success", "message", "Session revoked successfully");
    }

    @GetMapping("/config")
    public Map<String, Object> getAllConfigs() {
        return Map.of(
            "security", systemConfigService.getConfigsByCategoryMap("security"),
            "lockout", systemConfigService.getConfigsByCategoryMap("lockout"),
            "retention", systemConfigService.getConfigsByCategoryMap("retention"),
            "system", systemConfigService.getConfigsByCategoryMap("system")
        );
    }

    @GetMapping("/config/{category}")
    public Map<String, String> getConfigsByCategory(@PathVariable String category) {
        return systemConfigService.getConfigsByCategoryMap(category);
    }

    @PutMapping("/config")
    public Map<String, String> updateConfig(@RequestBody Map<String, String> request, Authentication authentication, HttpServletRequest httpRequest) {
        String key = request.get("key");
        String value = request.get("value");
        String category = request.get("category");
        String description = request.get("description");

        if (key == null || value == null || category == null) {
            return Map.of("status", "error", "message", "Missing required fields");
        }

        systemConfigService.createOrUpdateConfig(key, value, category, description);

        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        auditLogService.logEvent(adminUser, "CONFIG_UPDATED", "SystemConfig", null, ipAddress,
            "Updated configuration: " + key + " = " + value);

        return Map.of("status", "success", "message", "Configuration updated successfully");
    }

    @PostMapping("/config/initialize")
    public Map<String, String> initializeConfigs() {
        systemConfigService.initializeDefaultConfigs();
        return Map.of("status", "success", "message", "Default configurations initialized");
    }

    @GetMapping("/rate-limits")
    public List<RateLimit> getAllRateLimits() {
        return rateLimitService.getAllRateLimits();
    }

    @PostMapping("/rate-limits")
    public Map<String, String> createOrUpdateRateLimit(@RequestBody Map<String, Object> request, Authentication authentication, HttpServletRequest httpRequest) {
        String endpoint = (String) request.get("endpoint");
        Integer maxRequests = ((Number) request.get("maxRequests")).intValue();
        Integer windowMinutes = ((Number) request.get("windowMinutes")).intValue();
        Boolean enabled = request.get("enabled") != null ? (Boolean) request.get("enabled") : true;

        if (endpoint == null || maxRequests == null || windowMinutes == null) {
            return Map.of("status", "error", "message", "Missing required fields");
        }

        rateLimitService.createOrUpdateRateLimit(endpoint, maxRequests, windowMinutes, enabled);

        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        auditLogService.logEvent(adminUser, "RATE_LIMIT_UPDATED", "RateLimit", null, ipAddress,
            "Updated rate limit for endpoint: " + endpoint);

        return Map.of("status", "success", "message", "Rate limit updated successfully");
    }

    @DeleteMapping("/rate-limits/{endpoint}")
    public Map<String, String> deleteRateLimit(@PathVariable String endpoint, Authentication authentication, HttpServletRequest httpRequest) {
        rateLimitService.deleteRateLimit(endpoint);

        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = getClientIpAddress(httpRequest);
        auditLogService.logEvent(adminUser, "RATE_LIMIT_DELETED", "RateLimit", null, ipAddress,
            "Deleted rate limit for endpoint: " + endpoint);

        return Map.of("status", "success", "message", "Rate limit deleted successfully");
    }

    @PostMapping("/rate-limits/initialize")
    public Map<String, String> initializeRateLimits() {
        rateLimitService.initializeDefaultRateLimits();
        return Map.of("status", "success", "message", "Default rate limits initialized");
    }

    @GetMapping("/login-locations")
    public List<LoginLocation> getAllLoginLocations() {
        return loginLocationService.getUserLoginLocations(null);
    }

    @GetMapping("/login-locations/user/{userId}")
    public List<LoginLocation> getUserLoginLocations(@PathVariable Long userId) {
        return loginLocationService.getUserLoginLocations(userId);
    }

    @GetMapping("/login-locations/user/{userId}/recent")
    public LoginLocation getMostRecentLoginLocation(@PathVariable Long userId) {
        return loginLocationService.getMostRecentLoginLocation(userId);
    }

    private UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.isEnabled(), user.getCreatedAt());
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
