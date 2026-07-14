package com.authcore.authcore.service;

import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private LoginAttemptService loginAttemptService;

    @InjectMocks
    private UserService userService;

    @Test
    @SuppressWarnings("null")
    void registerUserShouldPersistAndHashPassword() {
        UserRegistrationRequest request = new UserRegistrationRequest("jane", "jane@example.com", "StrongPass123!");
        when(userRepository.existsByEmail(any(String.class))).thenReturn(false);
        when(userRepository.existsByUsername(any(String.class))).thenReturn(false);
        when(passwordEncoder.encode(any(CharSequence.class))).thenReturn("$2a$10$hashedPasswordPlaceholder");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            assertNotNull(user, "Saved user should not be null");
            return user;
        });

        UserEntity savedUser = userService.registerUser(request);

        assertEquals("jane", savedUser.getUsername());
        assertEquals("jane@example.com", savedUser.getEmail());
        assertEquals(true, savedUser.getPasswordHash().startsWith("$2a"));
    }

    @Test
    void authenticateUserShouldReturnUserForValidCredentials() {
        String hashedPassword = "$2a$10$hashedPasswordPlaceholder";
        UserEntity user = new UserEntity("jane", "jane@example.com", hashedPassword);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(loginAttemptService.isAccountLocked(any(UserEntity.class))).thenReturn(false);
        when(passwordEncoder.matches(any(CharSequence.class), any(String.class))).thenReturn(true);

        UserEntity authenticated = userService.authenticateUser(new LoginRequest("jane@example.com", "StrongPass123!"));

        assertEquals("jane", authenticated.getUsername());
    }
}
