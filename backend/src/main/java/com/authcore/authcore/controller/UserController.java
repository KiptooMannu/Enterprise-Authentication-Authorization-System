package com.authcore.authcore.controller;

import com.authcore.authcore.dto.ChangePasswordRequest;
import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.LoginResponse;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.dto.UserResponse;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.security.AuthResponse;
import com.authcore.authcore.security.JwtService;
import com.authcore.authcore.service.MfaService;
import com.authcore.authcore.service.UserService;
import com.authcore.authcore.util.ApiResponses;
import com.authcore.authcore.util.HttpRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import com.authcore.authcore.entity.RefreshToken;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final com.authcore.authcore.service.RefreshTokenService refreshTokenService;
    private final com.authcore.authcore.service.PasswordResetService passwordResetService;
    private final com.authcore.authcore.service.AuditLogService auditLogService;
    private final MfaService mfaService;
    private final com.authcore.authcore.service.LoginLocationService loginLocationService;

    public UserController(UserService userService, JwtService jwtService, com.authcore.authcore.service.RefreshTokenService refreshTokenService, com.authcore.authcore.service.PasswordResetService passwordResetService, com.authcore.authcore.service.AuditLogService auditLogService, MfaService mfaService, com.authcore.authcore.service.LoginLocationService loginLocationService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
        this.auditLogService = auditLogService;
        this.mfaService = mfaService;
        this.loginLocationService = loginLocationService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody UserRegistrationRequest request, HttpServletRequest httpRequest) {
        UserEntity user = userService.registerUser(request);
        String ipAddress = HttpRequestUtils.getClientIpAddress(httpRequest);
        auditLogService.logEvent(user, "USER_REGISTERED", "User", user.getId(), ipAddress, "User registered with email: " + user.getEmail());
        return UserResponse.from(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        UserEntity user = userService.authenticateUser(request);
        String ipAddress = HttpRequestUtils.getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check for new location security risk
        boolean isNewLocation = false;
        boolean isNewCity = false;
        boolean isNewCountry = false;
        
        if (request.latitude() != null && request.longitude() != null) {
            isNewLocation = loginLocationService.isNewLocation(user.getId(), request.latitude(), request.longitude());
        }

        // Normal login flow
        String token = jwtService.generateToken(user.getEmail());
        var refresh = refreshTokenService.createRefreshToken(user, ipAddress, userAgent);
        
        // Record login location
        com.authcore.authcore.entity.LoginLocation loginLocation = null;
        try {
            loginLocation = loginLocationService.recordLoginLocation(
                user.getId(),
                refresh.getId(),
                request.latitude(),
                request.longitude(),
                request.accuracy(),
                request.altitude(),
                request.heading(),
                request.speed(),
                httpRequest
            );
            
            // Check for new city/country after recording
            if (loginLocation.getCity() != null) {
                isNewCity = loginLocationService.isNewCity(user.getId(), loginLocation.getCity());
            }
            if (loginLocation.getCountry() != null) {
                isNewCountry = loginLocationService.isNewCountry(user.getId(), loginLocation.getCountry());
            }
        } catch (Exception e) {
            // Don't fail login if location recording fails
            System.err.println("Failed to record login location: " + e.getMessage());
        }

        // Check if MFA should be required due to new location
        boolean requiresMfa = mfaService.isEnabled(user);
        
        // Log new location detection even if MFA is not enabled
        if (isNewLocation || isNewCity || isNewCountry) {
            String reason = isNewLocation ? "New location detected" : 
                           (isNewCity ? "New city detected" : "New country detected");
            auditLogService.logEvent(user, "USER_LOGIN_NEW_LOCATION", "User", user.getId(), ipAddress, 
                "Suspicious login: " + reason + " (MFA not enabled)");
        }

        if (requiresMfa) {
            String challengeToken = mfaService.createLoginChallenge(user);
            auditLogService.logEvent(user, "USER_LOGIN_MFA_REQUIRED", "User", user.getId(), ipAddress, 
                "MFA required for login: MFA enabled");
            return ResponseEntity.ok(LoginResponse.mfaRequired(challengeToken));
        }
        
        auditLogService.logEvent(user, "USER_LOGIN", "User", user.getId(), ipAddress, "User logged in successfully");
        return ResponseEntity.ok(new AuthResponse(token, refresh.getToken(), "success"));
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        return UserResponse.from(user);
    }

    @PostMapping("/change-password")
    public UserResponse changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        UserEntity user = userService.changePassword(authentication.getName(), request);
        String ipAddress = HttpRequestUtils.getClientIpAddress(httpRequest);
        auditLogService.logEvent(user, "PASSWORD_CHANGED", "User", user.getId(), ipAddress, "User changed password");
        return UserResponse.from(user);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(ApiResponses.error("Email is required"));
        }
        try {
            passwordResetService.createPasswordResetToken(email);
            return ResponseEntity.ok(ApiResponses.success("Password reset email sent"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponses.error(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        
        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponses.error("Token and new password are required"));
        }
        
        boolean success = passwordResetService.resetPassword(token, newPassword);
        if (success) {
            return ResponseEntity.ok(ApiResponses.success("Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponses.error("Invalid or expired reset token"));
        }
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getActiveSessions(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        List<RefreshToken> tokens = refreshTokenService.getActiveSessions(user);
        List<Map<String, Object>> sessions = tokens.stream().map(t -> {
            Map<String, Object> session = new java.util.HashMap<>();
            session.put("id", t.getId());
            session.put("token", t.getToken());
            session.put("ipAddress", t.getIpAddress() != null ? t.getIpAddress() : "unknown");
            session.put("userAgent", t.getUserAgent() != null ? t.getUserAgent() : "unknown");
            session.put("createdAt", t.getCreatedAt());
            session.put("expiryDate", t.getExpiryDate());
            return session;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/sessions/revoke")
    public ResponseEntity<?> revokeSession(Authentication authentication, @RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null) {
            return ResponseEntity.badRequest().body(ApiResponses.error("Token is required"));
        }
        refreshTokenService.deleteByToken(token);
        return ResponseEntity.ok(ApiResponses.success("Session revoked successfully"));
    }

    @PostMapping("/sessions/revoke-all")
    public ResponseEntity<?> revokeAllSessions(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        refreshTokenService.deleteByUser(user);
        return ResponseEntity.ok(ApiResponses.success("All sessions revoked"));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getMyAuditLogs(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(auditLogService.getUserAuditLogs(user));
    }

}
