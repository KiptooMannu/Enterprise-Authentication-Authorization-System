package com.authcore.authcore.security;

public record AuthResponse(String token, String refreshToken, String message) {
}
