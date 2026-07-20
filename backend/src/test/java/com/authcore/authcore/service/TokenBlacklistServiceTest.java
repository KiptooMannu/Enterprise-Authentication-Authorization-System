package com.authcore.authcore.service;

import com.authcore.authcore.entity.TokenBlacklist;
import com.authcore.authcore.repository.TokenBlacklistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistServiceTest {

    @Mock
    private TokenBlacklistRepository repo;

    @InjectMocks
    private TokenBlacklistService service;

    @Test
    void blacklistShouldPersistTokenWithExpiry() {
        Instant expiry = Instant.now().plus(1, ChronoUnit.HOURS);

        service.blacklist("token-123", expiry);

        ArgumentCaptor<TokenBlacklist> captor = ArgumentCaptor.forClass(TokenBlacklist.class);
        verify(repo).save(captor.capture());
        assertEquals("token-123", captor.getValue().getToken());
        assertEquals(expiry, captor.getValue().getExpiry());
    }

    @Test
    void isBlacklistedShouldReturnTrueForUnexpiredToken() {
        TokenBlacklist entry = new TokenBlacklist("token-123", Instant.now().plus(1, ChronoUnit.HOURS));
        when(repo.findByToken("token-123")).thenReturn(Optional.of(entry));

        assertTrue(service.isBlacklisted("token-123"));
    }

    @Test
    void isBlacklistedShouldReturnFalseForExpiredToken() {
        TokenBlacklist entry = new TokenBlacklist("token-123", Instant.now().minus(1, ChronoUnit.HOURS));
        when(repo.findByToken("token-123")).thenReturn(Optional.of(entry));

        assertFalse(service.isBlacklisted("token-123"));
    }

    @Test
    void isBlacklistedShouldReturnFalseForUnknownToken() {
        when(repo.findByToken("missing")).thenReturn(Optional.empty());

        assertFalse(service.isBlacklisted("missing"));
    }

    @Test
    void cleanupExpiredShouldDeleteExpiredEntries() {
        service.cleanupExpired();

        verify(repo).deleteByExpiryBefore(any(Instant.class));
    }

    @Test
    void revokeByTokenShouldDeleteWhenPresent() {
        TokenBlacklist entry = new TokenBlacklist("token-123", Instant.now());
        when(repo.findByToken("token-123")).thenReturn(Optional.of(entry));

        service.revokeByToken("token-123");

        verify(repo).delete(entry);
    }

    @Test
    void revokeByTokenShouldDoNothingWhenAbsent() {
        when(repo.findByToken("missing")).thenReturn(Optional.empty());

        service.revokeByToken("missing");

        verify(repo, never()).delete(any(TokenBlacklist.class));
    }
}
