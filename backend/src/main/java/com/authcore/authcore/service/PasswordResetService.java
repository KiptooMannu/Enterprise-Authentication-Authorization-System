package com.authcore.authcore.service;

import com.authcore.authcore.entity.PasswordReset;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.PasswordResetRepository;
import com.authcore.authcore.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private JavaMailSender mailSender; // optional in tests
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public PasswordResetService(PasswordResetRepository passwordResetRepository, UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        this.passwordResetRepository = passwordResetRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Autowired(required = false)
    public void setMailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public PasswordReset createPasswordResetToken(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        passwordResetRepository.deleteByUser(user);

        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(1, ChronoUnit.HOURS);
        
        PasswordReset passwordReset = new PasswordReset(token, user, expiry);
        passwordReset = passwordResetRepository.save(passwordReset);
        
        if (mailSender != null) {
            sendPasswordResetEmail(user.getEmail(), token);
        }
        
        return passwordReset;
    }

    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordReset> resetOpt = passwordResetRepository.findByToken(token);
        
        if (resetOpt.isEmpty()) {
            return false;
        }
        
        PasswordReset reset = resetOpt.get();
        
        if (reset.isUsed()) {
            return false;
        }
        
        if (reset.getExpiryDate().isBefore(Instant.now())) {
            passwordResetRepository.deleteByToken(token);
            return false;
        }
        
        UserEntity user = reset.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        reset.setUsed(true);
        passwordResetRepository.save(reset);
        
        return true;
    }

    private void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Reset your password");
        message.setText("You requested a password reset. Click the link below to reset your password:\n\n" +
                "http://localhost:8080/api/auth/reset-password?token=" + token + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request this password reset, please ignore this email.");
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Don't throw - the reset token is already persisted and the response must not
            // reveal whether the address exists. Preserve the stack trace for diagnostics.
            log.error("Failed to send password reset email to {}", toEmail, e);
        }
    }
}
