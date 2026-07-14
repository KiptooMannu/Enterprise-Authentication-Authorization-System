package com.authcore.authcore.repository;

import com.authcore.authcore.entity.RefreshToken;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUser(UserEntity user);
    void deleteByUser(UserEntity user);
    void deleteByToken(String token);
}
