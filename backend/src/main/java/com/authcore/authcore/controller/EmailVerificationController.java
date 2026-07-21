package com.authcore.authcore.controller;

import com.authcore.authcore.service.EmailVerificationService;
import com.authcore.authcore.util.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    public EmailVerificationController(EmailVerificationService emailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        boolean verified = emailVerificationService.verifyEmail(token);
        
        if (verified) {
            return ResponseEntity.ok(ApiResponses.success("Email verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(ApiResponses.message("error", "Invalid or expired verification token"));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        
        if (email == null) {
            return ResponseEntity.badRequest().body(ApiResponses.message("error", "Email is required"));
        }
        
        emailVerificationService.resendVerificationToken(email);
        
        return ResponseEntity.ok(ApiResponses.success("Verification email sent successfully"));
    }
}
