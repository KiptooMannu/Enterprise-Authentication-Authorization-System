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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void registerUserShouldPersistAndHashPassword() {
        UserRegistrationRequest request = new UserRegistrationRequest("jane", "jane@example.com", "StrongPass123!");
        when(userRepository.existsByEmail(any(String.class))).thenReturn(false);
        when(userRepository.existsByUsername(any(String.class))).thenReturn(false);
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserEntity savedUser = userService.registerUser(request);

        assertEquals("jane", savedUser.getUsername());
        assertEquals("jane@example.com", savedUser.getEmail());
        assertEquals(true, savedUser.getPasswordHash().startsWith("$2a"));
    }

    @Test
    void authenticateUserShouldReturnUserForValidCredentials() {
        String hashedPassword = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("StrongPass123!");
        UserEntity user = new UserEntity("jane", "jane@example.com", hashedPassword);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        UserEntity authenticated = userService.authenticateUser(new LoginRequest("jane@example.com", "StrongPass123!"));

        assertEquals("jane", authenticated.getUsername());
    }
}
