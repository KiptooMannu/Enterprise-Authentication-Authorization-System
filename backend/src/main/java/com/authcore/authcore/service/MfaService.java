package com.authcore.authcore.service;

import com.authcore.authcore.entity.MfaChallenge;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.MfaChallengeRepository;
import com.authcore.authcore.repository.UserRepository;
import com.authcore.authcore.security.TotpService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class MfaService {

    private static final int CHALLENGE_TTL_MINUTES = 5;
    private static final String ISSUER = "AuthCore";

    private final UserRepository userRepository;
    private final MfaChallengeRepository mfaChallengeRepository;
    private final TotpService totpService;

    public MfaService(UserRepository userRepository, MfaChallengeRepository mfaChallengeRepository, TotpService totpService) {
        this.userRepository = userRepository;
        this.mfaChallengeRepository = mfaChallengeRepository;
        this.totpService = totpService;
    }

    /** Starts (or restarts) MFA enrollment for a user. The secret is not active until confirmed via confirmSetup. */
    @Transactional
    public MfaSetupResult startSetup(UserEntity user) {
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);
        String uri = totpService.buildOtpAuthUri(secret, user.getEmail(), ISSUER);
        return new MfaSetupResult(secret, uri);
    }

    /** Confirms enrollment: the user proves they can generate a valid code, which enables MFA. */
    @Transactional
    public void confirmSetup(UserEntity user, String code) {
        if (user.getMfaSecret() == null) {
            throw new IllegalArgumentException("MFA setup has not been started for this account");
        }
        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    /** Disables MFA, requiring a valid current code as proof of possession. */
    @Transactional
    public void disable(UserEntity user, String code) {
        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new IllegalArgumentException("MFA is not currently enabled for this account");
        }
        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
        mfaChallengeRepository.deleteByUser(user);
    }

    public boolean isEnabled(UserEntity user) {
        return user.isMfaEnabled();
    }

    /** Issues a short-lived challenge token once a user's password has been verified but MFA is still required. */
    @Transactional
    public String createLoginChallenge(UserEntity user) {
        mfaChallengeRepository.deleteByUser(user);
        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(CHALLENGE_TTL_MINUTES, ChronoUnit.MINUTES);
        MfaChallenge challenge = new MfaChallenge(token, user, expiry);
        mfaChallengeRepository.save(challenge);
        return token;
    }

    /** Resolves a login challenge token + TOTP code to the underlying user, consuming the challenge. */
    @Transactional
    public UserEntity resolveLoginChallenge(String challengeToken, String code) {
        MfaChallenge challenge = mfaChallengeRepository.findByToken(challengeToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired MFA challenge"));

        if (challenge.getExpiryDate().isBefore(Instant.now())) {
            mfaChallengeRepository.deleteByToken(challengeToken);
            throw new IllegalArgumentException("MFA challenge has expired, please log in again");
        }

        UserEntity user = challenge.getUser();
        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }

        mfaChallengeRepository.deleteByToken(challengeToken);
        return user;
    }

    public record MfaSetupResult(String secret, String otpAuthUri) {
    }
}
