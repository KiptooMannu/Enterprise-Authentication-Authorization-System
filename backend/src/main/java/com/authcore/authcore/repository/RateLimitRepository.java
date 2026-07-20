package com.authcore.authcore.repository;

import com.authcore.authcore.entity.RateLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RateLimitRepository extends JpaRepository<RateLimit, Long> {

    Optional<RateLimit> findByEndpoint(String endpoint);

    List<RateLimit> findByEnabledTrue();

    boolean existsByEndpoint(String endpoint);
}
