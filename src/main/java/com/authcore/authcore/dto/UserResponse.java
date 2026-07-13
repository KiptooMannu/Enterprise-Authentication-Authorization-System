package com.authcore.authcore.dto;

import com.authcore.authcore.entity.UserRole;

import java.time.Instant;

public record UserResponse(
        Long id,
        String username,
        String email,
        UserRole role,
        boolean enabled,
        Instant createdAt
) {
}
