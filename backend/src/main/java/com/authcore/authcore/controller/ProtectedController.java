package com.authcore.authcore.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/protected")
public class ProtectedController {

    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        String name = (authentication != null) ? authentication.getName() : "anonymous";
        return Map.of("principal", name);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminArea(Authentication authentication) {
        return Map.of("status", "admin access granted", "principal", authentication.getName());
    }

    @GetMapping("/manager")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public Map<String, String> managerArea(Authentication authentication) {
        return Map.of("status", "manager access granted", "principal", authentication.getName());
    }
}
