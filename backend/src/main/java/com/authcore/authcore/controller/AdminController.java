package com.authcore.authcore.controller;

import com.authcore.authcore.dto.UserResponse;
import com.authcore.authcore.entity.AuditLog;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.service.AuditLogService;
import com.authcore.authcore.service.UserService;
import com.authcore.authcore.util.HttpRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AuditLogService auditLogService;

    public AdminController(UserService userService, AuditLogService auditLogService) {
        this.userService = userService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.findAllUsers().stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
    }

    @PutMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable Long id, @RequestParam UserRole role, Authentication authentication, HttpServletRequest httpRequest) {
        UserEntity targetUser = userService.findById(id);
        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = HttpRequestUtils.getClientIpAddress(httpRequest);
        
        UserEntity user = userService.updateUserRole(id, role);
        auditLogService.logEvent(adminUser, "ROLE_UPDATED", "User", id, ipAddress, 
            "Updated role for user " + targetUser.getEmail() + " to " + role);
        return UserResponse.from(user);
    }

    @PutMapping("/users/{id}/status")
    public UserResponse updateStatus(@PathVariable Long id, @RequestParam boolean enabled, Authentication authentication, HttpServletRequest httpRequest) {
        UserEntity targetUser = userService.findById(id);
        UserEntity adminUser = userService.findByEmail(authentication.getName());
        String ipAddress = HttpRequestUtils.getClientIpAddress(httpRequest);
        
        UserEntity user = userService.updateUserStatus(id, enabled);
        auditLogService.logEvent(adminUser, "STATUS_UPDATED", "User", id, ipAddress, 
            "Updated status for user " + targetUser.getEmail() + " to " + (enabled ? "enabled" : "disabled"));
        return UserResponse.from(user);
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
}
