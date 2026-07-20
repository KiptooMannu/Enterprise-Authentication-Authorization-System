package com.authcore.authcore.service;

import com.authcore.authcore.entity.MfaChallenge;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.MfaChallengeRepository;
import com.authcore.authcore.repository.UserRepository;
import com.authcore.authcore.security.TotpService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MfaServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MfaChallengeRepository mfaChallengeRepository;

    @Mock
    private TotpService totpService;

    @InjectMocks
    private MfaService service;

    private final UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

    @Test
    void startSetupShouldStoreSecretAndReturnUri() {
        when(totpService.generateSecret()).thenReturn("SECRET123");
        when(totpService.buildOtpAuthUri("SECRET123", "jane@example.com", "AuthCore"))
                .thenReturn("otpauth://uri");

        MfaService.MfaSetupResult result = service.startSetup(user);

        assertEquals("SECRET123", result.secret());
        assertEquals("otpauth://uri", result.otpAuthUri());
        assertEquals("SECRET123", user.getMfaSecret());
        assertFalse(user.isMfaEnabled());
        verify(userRepository).save(user);
    }

    @Test
    void confirmSetupShouldThrowWhenSecretMissing() {
        user.setMfaSecret(null);

        assertThrows(IllegalArgumentException.class, () -> service.confirmSetup(user, "123456"));
    }

    @Test
    void confirmSetupShouldThrowForInvalidCode() {
        user.setMfaSecret("SECRET");
        when(totpService.verifyCode("SECRET", "000000")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.confirmSetup(user, "000000"));
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    void confirmSetupShouldEnableMfaForValidCode() {
        user.setMfaSecret("SECRET");
        when(totpService.verifyCode("SECRET", "123456")).thenReturn(true);

        service.confirmSetup(user, "123456");

        assertTrue(user.isMfaEnabled());
        verify(userRepository).save(user);
    }

    @Test
    void disableShouldThrowWhenMfaNotEnabled() {
        user.setMfaEnabled(false);

        assertThrows(IllegalArgumentException.class, () -> service.disable(user, "123456"));
    }

    @Test
    void disableShouldThrowForInvalidCode() {
        user.setMfaEnabled(true);
        user.setMfaSecret("SECRET");
        when(totpService.verifyCode("SECRET", "000000")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> service.disable(user, "000000"));
    }

    @Test
    void disableShouldClearSecretAndChallengesForValidCode() {
        user.setMfaEnabled(true);
        user.setMfaSecret("SECRET");
        when(totpService.verifyCode("SECRET", "123456")).thenReturn(true);

        service.disable(user, "123456");

        assertFalse(user.isMfaEnabled());
        assertNull(user.getMfaSecret());
        verify(userRepository).save(user);
        verify(mfaChallengeRepository).deleteByUser(user);
    }

    @Test
    void isEnabledShouldReflectUserState() {
        user.setMfaEnabled(true);
        assertTrue(service.isEnabled(user));
    }

    @Test
    void createLoginChallengeShouldClearExistingAndSaveNew() {
        String token = service.createLoginChallenge(user);

        assertNotNull(token);
        verify(mfaChallengeRepository).deleteByUser(user);
        verify(mfaChallengeRepository).save(any(MfaChallenge.class));
    }

    @Test
    void resolveLoginChallengeShouldThrowForUnknownToken() {
        when(mfaChallengeRepository.findByToken("missing")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.resolveLoginChallenge("missing", "123456"));
    }

    @Test
    void resolveLoginChallengeShouldDeleteAndThrowForExpiredChallenge() {
        MfaChallenge challenge = new MfaChallenge("t", user, Instant.now().minus(1, ChronoUnit.MINUTES));
        when(mfaChallengeRepository.findByToken("t")).thenReturn(Optional.of(challenge));

        assertThrows(IllegalArgumentException.class,
                () -> service.resolveLoginChallenge("t", "123456"));
        verify(mfaChallengeRepository).deleteByToken("t");
    }

    @Test
    void resolveLoginChallengeShouldThrowForInvalidCode() {
        user.setMfaSecret("SECRET");
        MfaChallenge challenge = new MfaChallenge("t", user, Instant.now().plus(5, ChronoUnit.MINUTES));
        when(mfaChallengeRepository.findByToken("t")).thenReturn(Optional.of(challenge));
        when(totpService.verifyCode("SECRET", "000000")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> service.resolveLoginChallenge("t", "000000"));
    }

    @Test
    void resolveLoginChallengeShouldReturnUserAndConsumeChallengeForValidCode() {
        user.setMfaSecret("SECRET");
        MfaChallenge challenge = new MfaChallenge("t", user, Instant.now().plus(5, ChronoUnit.MINUTES));
        when(mfaChallengeRepository.findByToken("t")).thenReturn(Optional.of(challenge));
        when(totpService.verifyCode("SECRET", "123456")).thenReturn(true);

        UserEntity resolved = service.resolveLoginChallenge("t", "123456");

        assertSame(user, resolved);
        verify(mfaChallengeRepository).deleteByToken("t");
    }
}
