package com.authcore.authcore.service;

import com.authcore.authcore.entity.RefreshToken;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.RefreshTokenRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService service;

    private final UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

    @Test
    void createRefreshTokenShouldGenerateUuidTokenWith30DayExpiry() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken created = service.createRefreshToken(user, "10.0.0.1", "agent");

        assertNotNull(created.getToken());
        assertSame(user, created.getUser());
        assertEquals("10.0.0.1", created.getIpAddress());
        assertEquals("agent", created.getUserAgent());
        assertTrue(created.getExpiryDate().isAfter(Instant.now().plus(29, ChronoUnit.DAYS)));
    }

    @Test
    void createRefreshTokenWithoutMetadataShouldDefaultToUnknown() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken created = service.createRefreshToken(user);

        assertEquals("unknown", created.getIpAddress());
        assertEquals("unknown", created.getUserAgent());
    }

    @Test
    void refreshTokenShouldRotateAndPreserveMetadataWhenNotProvided() {
        RefreshToken existing = new RefreshToken("old-token", user,
                Instant.now().plus(10, ChronoUnit.DAYS), "1.2.3.4", "old-agent");
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(existing));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken rotated = service.refreshToken("old-token");

        verify(refreshTokenRepository).deleteByToken("old-token");
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertEquals("1.2.3.4", rotated.getIpAddress());
        assertEquals("old-agent", rotated.getUserAgent());
        assertSame(user, rotated.getUser());
    }

    @Test
    void refreshTokenShouldUseProvidedMetadataWhenGiven() {
        RefreshToken existing = new RefreshToken("old-token", user,
                Instant.now().plus(10, ChronoUnit.DAYS), "1.2.3.4", "old-agent");
        when(refreshTokenRepository.findByToken("old-token")).thenReturn(Optional.of(existing));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken rotated = service.refreshToken("old-token", "9.9.9.9", "new-agent");

        assertEquals("9.9.9.9", rotated.getIpAddress());
        assertEquals("new-agent", rotated.getUserAgent());
    }

    @Test
    void refreshTokenShouldThrowForUnknownToken() {
        when(refreshTokenRepository.findByToken("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.refreshToken("missing"));
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void refreshTokenShouldDeleteAndThrowForExpiredToken() {
        RefreshToken expired = new RefreshToken("expired", user,
                Instant.now().minus(1, ChronoUnit.DAYS), "ip", "agent");
        when(refreshTokenRepository.findByToken("expired")).thenReturn(Optional.of(expired));

        assertThrows(IllegalArgumentException.class, () -> service.refreshToken("expired"));
        verify(refreshTokenRepository).deleteByToken("expired");
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
    }

    @Test
    void findByTokenShouldDelegateToRepository() {
        RefreshToken token = new RefreshToken("t", user, Instant.now(), "ip", "agent");
        when(refreshTokenRepository.findByToken("t")).thenReturn(Optional.of(token));

        assertSame(token, service.findByToken("t").orElseThrow());
    }

    @Test
    void deleteByTokenShouldDelegateToRepository() {
        service.deleteByToken("t");
        verify(refreshTokenRepository).deleteByToken("t");
    }

    @Test
    void deleteByUserShouldDelegateToRepository() {
        service.deleteByUser(user);
        verify(refreshTokenRepository).deleteByUser(user);
    }

    @Test
    void getActiveSessionsShouldDelegateToRepository() {
        service.getActiveSessions(user);
        verify(refreshTokenRepository).findByUser(user);
    }
}
