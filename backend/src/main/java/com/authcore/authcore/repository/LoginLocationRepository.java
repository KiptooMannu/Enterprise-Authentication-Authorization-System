package com.authcore.authcore.repository;

import com.authcore.authcore.entity.LoginLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoginLocationRepository extends JpaRepository<LoginLocation, Long> {

    List<LoginLocation> findByUserIdOrderByLoginTimeDesc(Long userId);

    Optional<LoginLocation> findFirstByUserIdOrderByLoginTimeDesc(Long userId);

    List<LoginLocation> findBySessionId(Long sessionId);

    @Query("SELECT ll FROM LoginLocation ll WHERE ll.userId = :userId AND ll.loginTime > :since ORDER BY ll.loginTime DESC")
    List<LoginLocation> findByUserIdSince(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT DISTINCT ll.city FROM LoginLocation ll WHERE ll.userId = :userId AND ll.city IS NOT NULL")
    List<String> findDistinctCitiesByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT ll.country FROM LoginLocation ll WHERE ll.userId = :userId AND ll.country IS NOT NULL")
    List<String> findDistinctCountriesByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT ll.city) FROM LoginLocation ll WHERE ll.userId = :userId AND ll.city IS NOT NULL")
    long countDistinctCitiesByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT ll.country) FROM LoginLocation ll WHERE ll.userId = :userId AND ll.country IS NOT NULL")
    long countDistinctCountriesByUserId(@Param("userId") Long userId);
}
