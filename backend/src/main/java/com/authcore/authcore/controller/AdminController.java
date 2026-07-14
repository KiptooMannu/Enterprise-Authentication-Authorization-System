package com.authcore.authcore.controller;

import com.authcore.authcore.dto.UserResponse;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.findAllUsers().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @PutMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable Long id, @RequestParam UserRole role) {
        UserEntity user = userService.updateUserRole(id, role);
        return toUserResponse(user);
    }

    @PutMapping("/users/{id}/status")
    public UserResponse updateStatus(@PathVariable Long id, @RequestParam boolean enabled) {
        UserEntity user = userService.updateUserStatus(id, enabled);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(UserEntity user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.isEnabled(), user.getCreatedAt());
    }
}
