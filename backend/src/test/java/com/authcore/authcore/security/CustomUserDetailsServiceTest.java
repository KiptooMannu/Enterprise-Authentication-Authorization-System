package com.authcore.authcore.security;

import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService service;

    @Test
    void loadUserByUsernameShouldMapEntityToUserDetailsWithRoleAuthority() {
        UserEntity user = new UserEntity("jane", "jane@example.com", "hashed");
        user.setRole(UserRole.ADMIN);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("jane@example.com");

        assertEquals("jane@example.com", details.getUsername());
        assertEquals("hashed", details.getPassword());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void loadUserByUsernameShouldReflectDisabledState() {
        UserEntity user = new UserEntity("jane", "jane@example.com", "hashed");
        user.setEnabled(false);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("jane@example.com");

        assertFalse(details.isEnabled());
    }

    @Test
    void loadUserByUsernameShouldThrowWhenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing@example.com"));
    }
}
