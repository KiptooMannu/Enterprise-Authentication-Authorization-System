package com.authcore.authcore.repository;

import com.authcore.authcore.entity.AuditLog;
import com.authcore.authcore.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUser(UserEntity user);

    List<AuditLog> findByAction(String action);

    @Query("SELECT a FROM AuditLog a WHERE a.user = :user AND a.timestamp > :since ORDER BY a.timestamp DESC")
    List<AuditLog> findByUserSince(@Param("user") UserEntity user, @Param("since") Instant since);

    @Query("SELECT a FROM AuditLog a ORDER BY a.timestamp DESC")
    List<AuditLog> findAllOrderByTimestampDesc();
}
