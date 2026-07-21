package com.authcore.authcore.controller;

import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.UserRepository;
import com.authcore.authcore.service.UserService;
import com.authcore.authcore.util.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    private final UserService userService;
    private final UserRepository userRepository;

    public OAuth2Controller(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/accounts")
    public ResponseEntity<?> getLinkedAccounts(Authentication authentication) {
        UserEntity user = userService.findByEmail(authentication.getName());
        Map<String, Object> linked = new HashMap<>();
        
        linked.put("google", "google".equalsIgnoreCase(user.getOauthProvider()));
        linked.put("github", "github".equalsIgnoreCase(user.getOauthProvider()));
        
        return ResponseEntity.ok(linked);
    }

    @DeleteMapping("/unlink/{provider}")
    public ResponseEntity<?> unlinkAccount(Authentication authentication, @PathVariable String provider) {
        UserEntity user = userService.findByEmail(authentication.getName());
        
        if (user.getOauthProvider() == null || !user.getOauthProvider().equalsIgnoreCase(provider)) {
            return ResponseEntity.badRequest().body(ApiResponses.error("Account is not linked to " + provider));
        }

        // Prevent lockout if there's no password hash
        if (user.getPasswordHash() == null) {
            return ResponseEntity.badRequest().body(ApiResponses.error(
                "Cannot unlink the only authentication method. Please set a password first."
            ));
        }

        user.setOauthProvider(null);
        user.setOauthProviderId(null);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponses.success("Unlinked " + provider + " account successfully"));
    }
}
