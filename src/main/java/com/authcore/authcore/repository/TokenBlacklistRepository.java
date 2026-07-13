package com.authcore.authcore.repository;

import com.authcore.authcore.entity.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, Long> {
    Optional<TokenBlacklist> findByToken(String token);
    void deleteByExpiryBefore(Instant time);
}
