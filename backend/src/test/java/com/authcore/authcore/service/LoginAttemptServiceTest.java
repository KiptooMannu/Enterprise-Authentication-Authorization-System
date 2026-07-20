package com.authcore.authcore.service;

import com.authcore.authcore.entity.LoginAttempt;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.LoginAttemptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private LoginAttemptRepository loginAttemptRepository;

    @InjectMocks
    private LoginAttemptService service;

    private final UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

    private List<LoginAttempt> failedAttempts(int count) {
        return Collections.nCopies(count, new LoginAttempt(user, "ip", false));
    }

    @Test
    void recordSuccessfulAttemptShouldSaveAndResetFailures() {
        service.recordLoginAttempt(user, "10.0.0.1", true);

        ArgumentCaptor<LoginAttempt> captor = ArgumentCaptor.forClass(LoginAttempt.class);
        verify(loginAttemptRepository).save(captor.capture());
        assertTrue(captor.getValue().isSuccessful());
        assertEquals("10.0.0.1", captor.getValue().getIpAddress());
        verify(loginAttemptRepository).deleteByUser(user);
    }

    @Test
    void recordFailedAttemptShouldSaveButNotReset() {
        service.recordLoginAttempt(user, "10.0.0.1", false);

        verify(loginAttemptRepository).save(any(LoginAttempt.class));
        verify(loginAttemptRepository, never()).deleteByUser(any(UserEntity.class));
    }

    @Test
    void isAccountLockedShouldBeTrueAtThreshold() {
        when(loginAttemptRepository.findFailedAttemptsByUserSince(eq(user), any(Instant.class)))
                .thenReturn(failedAttempts(5));

        assertTrue(service.isAccountLocked(user));
    }

    @Test
    void isAccountLockedShouldBeFalseBelowThreshold() {
        when(loginAttemptRepository.findFailedAttemptsByUserSince(eq(user), any(Instant.class)))
                .thenReturn(failedAttempts(4));

        assertFalse(service.isAccountLocked(user));
    }

    @Test
    void getRemainingAttemptsShouldReflectFailures() {
        when(loginAttemptRepository.findFailedAttemptsByUserSince(eq(user), any(Instant.class)))
                .thenReturn(failedAttempts(2));

        assertEquals(3, service.getRemainingAttempts(user));
    }

    @Test
    void getRemainingAttemptsShouldNeverGoNegative() {
        when(loginAttemptRepository.findFailedAttemptsByUserSince(eq(user), any(Instant.class)))
                .thenReturn(failedAttempts(8));

        assertEquals(0, service.getRemainingAttempts(user));
    }

    @Test
    void resetFailedAttemptsShouldDeleteByUser() {
        service.resetFailedAttempts(user);

        verify(loginAttemptRepository).deleteByUser(user);
    }

    @Test
    void getUserLoginHistoryShouldDelegateToRepository() {
        List<LoginAttempt> history = failedAttempts(1);
        when(loginAttemptRepository.findByUser(user)).thenReturn(history);

        assertEquals(history, service.getUserLoginHistory(user));
    }
}
