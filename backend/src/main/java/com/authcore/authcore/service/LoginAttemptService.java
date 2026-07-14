package com.authcore.authcore.service;

import com.authcore.authcore.entity.LoginAttempt;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.LoginAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LoginAttemptService {

    private final LoginAttemptRepository loginAttemptRepository;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 30;

    public LoginAttemptService(LoginAttemptRepository loginAttemptRepository) {
        this.loginAttemptRepository = loginAttemptRepository;
    }

    @Transactional
    public void recordLoginAttempt(UserEntity user, String ipAddress, boolean successful) {
        LoginAttempt attempt = new LoginAttempt(user, ipAddress, successful);
        loginAttemptRepository.save(attempt);

        if (successful) {
            resetFailedAttempts(user);
        }
    }

    public boolean isAccountLocked(UserEntity user) {
        Instant lockoutThreshold = Instant.now().minus(LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES);
        List<LoginAttempt> failedAttempts = loginAttemptRepository.findFailedAttemptsByUserSince(user, lockoutThreshold);
        return failedAttempts.size() >= MAX_FAILED_ATTEMPTS;
    }

    public long getRemainingAttempts(UserEntity user) {
        Instant lockoutThreshold = Instant.now().minus(LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES);
        List<LoginAttempt> failedAttempts = loginAttemptRepository.findFailedAttemptsByUserSince(user, lockoutThreshold);
        return Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts.size());
    }

    @Transactional
    public void resetFailedAttempts(UserEntity user) {
        loginAttemptRepository.deleteByUser(user);
    }

    public List<LoginAttempt> getUserLoginHistory(UserEntity user) {
        return loginAttemptRepository.findByUser(user);
    }
}
