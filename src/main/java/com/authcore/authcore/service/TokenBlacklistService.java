package com.authcore.authcore.service;

import com.authcore.authcore.entity.TokenBlacklist;
import com.authcore.authcore.repository.TokenBlacklistRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
public class TokenBlacklistService {

    private final TokenBlacklistRepository repo;

    public TokenBlacklistService(TokenBlacklistRepository repo) {
        this.repo = repo;
    }

    public void blacklist(String token, Instant expiry) {
        repo.save(new TokenBlacklist(token, expiry));
    }

    public boolean isBlacklisted(String token) {
        Optional<TokenBlacklist> o = repo.findByToken(token);
        return o.isPresent() && o.get().getExpiry().isAfter(Instant.now());
    }

    public void cleanupExpired() {
        repo.deleteByExpiryBefore(Instant.now());
    }

    public void revokeByToken(String token) {
        repo.findByToken(token).ifPresent(t -> repo.delete(t));
    }
}
