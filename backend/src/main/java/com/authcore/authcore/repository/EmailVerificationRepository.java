package com.authcore.authcore.repository;

import com.authcore.authcore.entity.EmailVerification;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByToken(String token);

    Optional<EmailVerification> findByUser(UserEntity user);

    void deleteByToken(String token);

    void deleteByUser(UserEntity user);
}
