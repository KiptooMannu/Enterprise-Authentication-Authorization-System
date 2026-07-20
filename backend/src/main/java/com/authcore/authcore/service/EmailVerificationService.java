package com.authcore.authcore.service;

import com.authcore.authcore.entity.EmailVerification;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.EmailVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailVerificationRepository emailVerificationRepository;
    private JavaMailSender mailSender; // optional in tests

    @Autowired
    public EmailVerificationService(EmailVerificationRepository emailVerificationRepository) {
        this.emailVerificationRepository = emailVerificationRepository;
    }

    @Autowired(required = false)
    public void setMailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public EmailVerification createVerificationToken(UserEntity user) {
        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(24, ChronoUnit.HOURS);
        
        emailVerificationRepository.deleteByUser(user);
        
        EmailVerification verification = new EmailVerification(token, user, expiry);
        verification = emailVerificationRepository.save(verification);
        
        if (mailSender != null) {
            sendVerificationEmail(user.getEmail(), token);
        }
        
        return verification;
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<EmailVerification> verificationOpt = emailVerificationRepository.findByToken(token);
        
        if (verificationOpt.isEmpty()) {
            return false;
        }
        
        EmailVerification verification = verificationOpt.get();
        
        if (verification.isVerified()) {
            return true;
        }
        
        if (verification.getExpiryDate().isBefore(Instant.now())) {
            emailVerificationRepository.deleteByToken(token);
            return false;
        }
        
        verification.setVerified(true);
        emailVerificationRepository.save(verification);
        
        UserEntity user = verification.getUser();
        user.setEnabled(true);
        
        return true;
    }

    public Optional<EmailVerification> findByToken(String token) {
        return emailVerificationRepository.findByToken(token);
    }

    public void resendVerificationToken(String email) {
        // This would typically be called when a user requests to resend verification
        // For now, this is a placeholder
    }

    private void sendVerificationEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Verify your email address");
        message.setText("Please verify your email address by clicking the link below:\n\n" +
                "http://localhost:8080/api/auth/verify-email?token=" + token + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not request this verification, please ignore this email.");
        
        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't throw - email sending is not critical for registration.
            // Preserve the full stack trace so delivery failures can be diagnosed.
            log.error("Failed to send verification email to {}", toEmail, e);
        }
    }
}
