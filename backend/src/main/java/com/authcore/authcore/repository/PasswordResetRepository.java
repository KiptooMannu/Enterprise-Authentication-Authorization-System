package com.authcore.authcore.repository;

import com.authcore.authcore.entity.PasswordReset;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {

    Optional<PasswordReset> findByToken(String token);

    Optional<PasswordReset> findByUser(UserEntity user);

    void deleteByToken(String token);

    void deleteByUser(UserEntity user);
}
