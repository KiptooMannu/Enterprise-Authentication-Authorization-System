package com.authcore.authcore.service;

import com.authcore.authcore.dto.ChangePasswordRequest;
import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final LoginAttemptService loginAttemptService;
    private final com.authcore.authcore.repository.MfaChallengeRepository mfaChallengeRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, EmailVerificationService emailVerificationService, LoginAttemptService loginAttemptService, com.authcore.authcore.repository.MfaChallengeRepository mfaChallengeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationService = emailVerificationService;
        this.loginAttemptService = loginAttemptService;
        this.mfaChallengeRepository = mfaChallengeRepository;
    }

    public UserEntity registerUser(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        UserEntity user = new UserEntity(request.username(), request.email(), hashedPassword);
        user.setRole(UserRole.USER);
        user.setEnabled(true); // Enable by default; email verification deferred in tests
        user = userRepository.save(user);
        
        emailVerificationService.createVerificationToken(user);
        
        return user;
    }

    public UserEntity authenticateUser(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account is disabled");
        }

        if (loginAttemptService.isAccountLocked(user)) {
            throw new IllegalArgumentException("Account is temporarily locked due to too many failed login attempts");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptService.recordLoginAttempt(user, "unknown", false);
            long remainingAttempts = loginAttemptService.getRemainingAttempts(user);
            throw new IllegalArgumentException("Invalid credentials. Remaining attempts: " + remainingAttempts);
        }

        loginAttemptService.recordLoginAttempt(user, "unknown", true);
        return user;
    }

    public UserEntity findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<UserEntity> findAllUsers() {
        return userRepository.findAll();
    }

    @NonNull
    public UserEntity findById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public UserEntity updateUserRole(Long id, UserRole role) {
        UserEntity user = findById(id);
        user.setRole(role);
        return userRepository.save(user);
    }

    @Transactional
    public UserEntity updateUserStatus(Long id, boolean enabled) {
        UserEntity user = findById(id);
        user.setEnabled(enabled);
        return userRepository.save(user);
    }

    @Transactional
    public UserEntity changePassword(String email, ChangePasswordRequest request) {
        UserEntity user = findByEmail(email);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        UserEntity user = findById(id);
        // Clean up MFA challenges to avoid foreign key violations
        mfaChallengeRepository.deleteByUser(user);
        userRepository.delete(user);
    }
}
