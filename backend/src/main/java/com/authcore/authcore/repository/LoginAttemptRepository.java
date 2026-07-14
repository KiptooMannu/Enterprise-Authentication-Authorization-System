package com.authcore.authcore.repository;

import com.authcore.authcore.entity.LoginAttempt;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    List<LoginAttempt> findByUser(UserEntity user);

    @Query("SELECT la FROM LoginAttempt la WHERE la.user = :user AND la.successful = false AND la.timestamp > :since")
    List<LoginAttempt> findFailedAttemptsByUserSince(@Param("user") UserEntity user, @Param("since") Instant since);

    void deleteByUser(UserEntity user);
}
