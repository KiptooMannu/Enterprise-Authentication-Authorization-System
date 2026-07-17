package com.authcore.authcore.repository;

import com.authcore.authcore.entity.MfaChallenge;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MfaChallengeRepository extends JpaRepository<MfaChallenge, Long> {

    Optional<MfaChallenge> findByToken(String token);

    void deleteByToken(String token);

    void deleteByUser(UserEntity user);
}
