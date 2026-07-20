package com.authcore.authcore.service;

import com.authcore.authcore.entity.PasswordReset;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.PasswordResetRepository;
import com.authcore.authcore.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private PasswordResetRepository passwordResetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService service;

    private final UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

    @Test
    void createPasswordResetTokenShouldThrowWhenUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.createPasswordResetToken("missing@example.com"));
    }

    @Test
    void createPasswordResetTokenShouldClearExistingAndSaveNew() {
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordResetRepository.save(any(PasswordReset.class))).thenAnswer(i -> i.getArgument(0));

        PasswordReset created = service.createPasswordResetToken("jane@example.com");

        verify(passwordResetRepository).deleteByUser(user);
        assertNotNull(created.getToken());
        assertTrue(created.getExpiryDate().isAfter(Instant.now().plus(50, ChronoUnit.MINUTES)));
    }

    @Test
    void resetPasswordShouldReturnFalseForUnknownToken() {
        when(passwordResetRepository.findByToken("missing")).thenReturn(Optional.empty());

        assertFalse(service.resetPassword("missing", "newpass"));
    }

    @Test
    void resetPasswordShouldReturnFalseForUsedToken() {
        PasswordReset reset = new PasswordReset("t", user, Instant.now().plus(1, ChronoUnit.HOURS));
        reset.setUsed(true);
        when(passwordResetRepository.findByToken("t")).thenReturn(Optional.of(reset));

        assertFalse(service.resetPassword("t", "newpass"));
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void resetPasswordShouldDeleteAndReturnFalseForExpiredToken() {
        PasswordReset reset = new PasswordReset("t", user, Instant.now().minus(1, ChronoUnit.HOURS));
        when(passwordResetRepository.findByToken("t")).thenReturn(Optional.of(reset));

        assertFalse(service.resetPassword("t", "newpass"));
        verify(passwordResetRepository).deleteByToken("t");
    }

    @Test
    void resetPasswordShouldUpdateHashAndMarkUsedForValidToken() {
        PasswordReset reset = new PasswordReset("t", user, Instant.now().plus(1, ChronoUnit.HOURS));
        when(passwordResetRepository.findByToken("t")).thenReturn(Optional.of(reset));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded-newpass");

        assertTrue(service.resetPassword("t", "newpass"));

        assertEquals("encoded-newpass", user.getPasswordHash());
        verify(userRepository).save(user);
        ArgumentCaptor<PasswordReset> captor = ArgumentCaptor.forClass(PasswordReset.class);
        verify(passwordResetRepository).save(captor.capture());
        assertTrue(captor.getValue().isUsed());
    }
}
