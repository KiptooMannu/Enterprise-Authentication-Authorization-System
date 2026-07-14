package com.authcore.authcore.controller;

import com.authcore.authcore.dto.ChangePasswordRequest;
import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.dto.UserResponse;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.security.AuthResponse;
import com.authcore.authcore.security.JwtService;
import com.authcore.authcore.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final com.authcore.authcore.service.RefreshTokenService refreshTokenService;

    public UserController(UserService userService, JwtService jwtService, com.authcore.authcore.service.RefreshTokenService refreshTokenService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody UserRegistrationRequest request) {
        UserEntity user = userService.registerUser(request);
        return toUserResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        UserEntity user = userService.authenticateUser(request);
        String token = jwtService.generateToken(user.getEmail());
        var refresh = refreshTokenService.createRefreshToken(user);
        return new AuthResponse(token, refresh.getToken(), "success");
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        return toUserResponse(user);
    }

    @PostMapping("/change-password")
    public UserResponse changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        UserEntity user = userService.changePassword(authentication.getName(), request);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.isEnabled(), user.getCreatedAt());
    }
}
