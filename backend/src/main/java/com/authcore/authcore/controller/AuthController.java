package com.authcore.authcore.controller;

import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.security.AuthResponse;
import com.authcore.authcore.security.JwtService;
import com.authcore.authcore.service.RefreshTokenService;
import com.authcore.authcore.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final UserService userService;
    private final com.authcore.authcore.service.TokenBlacklistService tokenBlacklistService;

    public AuthController(RefreshTokenService refreshTokenService, JwtService jwtService, UserService userService, com.authcore.authcore.service.TokenBlacklistService tokenBlacklistService) {
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.userService = userService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String token = body.get("refreshToken");
        if (token == null) return ResponseEntity.badRequest().body(Map.of("error", "refreshToken required"));
        try {
            var newRefresh = refreshTokenService.refreshToken(token);
            String newAccess = jwtService.generateToken(newRefresh.getUser().getEmail());
            return ResponseEntity.ok(new AuthResponse(newAccess, newRefresh.getToken(), "refreshed"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(401).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, Authentication authentication, @RequestBody(required = false) Map<String, String> body) {
        if (authentication != null && authentication.isAuthenticated()) {
            UserEntity user = userService.findByEmail(authentication.getName());
            blacklistCurrentAccessToken(request);
            refreshTokenService.deleteByUser(user);
            return ResponseEntity.ok(Map.of("status", "logged out"));
        }

        if (body != null) {
            String email = body.get("email");
            if (email == null) return ResponseEntity.badRequest().body(Map.of("error", "email required"));
            UserEntity user = userService.findByEmail(email);
            refreshTokenService.deleteByUser(user);
            return ResponseEntity.ok(Map.of("status", "logged out"));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "authentication required"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(HttpServletRequest request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "authentication required"));
        }

        UserEntity user = userService.findByEmail(authentication.getName());
        blacklistCurrentAccessToken(request);
        refreshTokenService.deleteByUser(user);
        return ResponseEntity.ok(Map.of("status", "all sessions logged out"));
    }

    private void blacklistCurrentAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                java.util.Date expiryDate = jwtService.extractExpiration(token);
                tokenBlacklistService.blacklist(token, expiryDate.toInstant());
            } catch (Exception ex) {
                // Token may already be invalid or expired; nothing to blacklist. Record for diagnostics.
                log.debug("Could not blacklist access token during logout: {}", ex.getMessage());
            }
        }
    }

    @PostMapping("/revoke")
    public ResponseEntity<?> revoke(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String type = body.getOrDefault("type", "access");
        if (token == null) return ResponseEntity.badRequest().body(Map.of("error", "token required"));

        if ("refresh".equalsIgnoreCase(type)) {
            refreshTokenService.deleteByToken(token);
            return ResponseEntity.ok(Map.of("status", "refresh token revoked"));
        }

        try {
            java.util.Date d = jwtService.extractExpiration(token);
            java.time.Instant expiry = d.toInstant();
            tokenBlacklistService.blacklist(token, expiry);
            return ResponseEntity.ok(Map.of("status", "access token revoked"));
        } catch (Exception ex) {
            log.debug("Failed to revoke access token: {}", ex.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "invalid token"));
        }
    }
}
