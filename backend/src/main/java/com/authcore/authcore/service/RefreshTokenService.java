package com.authcore.authcore.service;

import com.authcore.authcore.entity.RefreshToken;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public RefreshToken createRefreshToken(UserEntity user) {
        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(30, ChronoUnit.DAYS);
        RefreshToken rt = new RefreshToken(token, user, expiry);
        return refreshTokenRepository.save(rt);
    }

    @Transactional
    public RefreshToken refreshToken(String token) {
        RefreshToken existing = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (existing.getExpiryDate().isBefore(Instant.now())) {
            // token expired — remove it and reject
            refreshTokenRepository.deleteByToken(token);
            throw new IllegalArgumentException("Refresh token expired");
        }

        // rotate: delete old token and create a new one for the same user
        UserEntity user = existing.getUser();
        refreshTokenRepository.deleteByToken(token);
        return createRefreshToken(user);
    }

    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public void deleteByUser(UserEntity user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
