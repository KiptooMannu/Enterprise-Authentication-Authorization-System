package com.authcore.authcore.controller;

import com.authcore.authcore.dto.LoginResponse;
import com.authcore.authcore.dto.MfaSetupResponse;
import com.authcore.authcore.dto.MfaStatusResponse;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.security.AuthResponse;
import com.authcore.authcore.security.JwtService;
import com.authcore.authcore.service.MfaService;
import com.authcore.authcore.service.RefreshTokenService;
import com.authcore.authcore.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mfa")
public class MfaController {

    private final MfaService mfaService;
    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public MfaController(MfaService mfaService, UserService userService, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.mfaService = mfaService;
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @GetMapping("/status")
    public ResponseEntity<MfaStatusResponse> getStatus(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(new MfaStatusResponse(mfaService.isEnabled(user)));
    }

    @PostMapping("/setup")
    public ResponseEntity<MfaSetupResponse> setup(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        MfaService.MfaSetupResult result = mfaService.startSetup(user);
        return ResponseEntity.ok(new MfaSetupResponse(result.secret(), result.otpAuthUri()));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifySetup(Authentication authentication, @RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "code required"));
        }
        UserEntity user = userService.findByEmail(authentication.getName());
        try {
            mfaService.confirmSetup(user, code);
            return ResponseEntity.ok(Map.of("message", "MFA enabled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/disable")
    public ResponseEntity<?> disable(Authentication authentication, @RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "code required"));
        }
        UserEntity user = userService.findByEmail(authentication.getName());
        try {
            mfaService.disable(user, code);
            return ResponseEntity.ok(Map.of("message", "MFA disabled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login-verify")
    public ResponseEntity<?> verifyLogin(@RequestBody Map<String, String> body) {
        String challengeToken = body.get("challengeToken");
        String code = body.get("code");
        if (challengeToken == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "challengeToken and code required"));
        }
        try {
            UserEntity user = mfaService.resolveLoginChallenge(challengeToken, code);
            String accessToken = jwtService.generateToken(user.getEmail());
            var refreshToken = refreshTokenService.createRefreshToken(user);
            AuthResponse authResponse = new AuthResponse(accessToken, refreshToken.getToken(), "success");
            return ResponseEntity.ok(authResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
