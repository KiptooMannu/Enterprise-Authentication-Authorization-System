package com.authcore.authcore.dto;

import com.authcore.authcore.entity.UserEntity;
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
    public static UserResponse from(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
