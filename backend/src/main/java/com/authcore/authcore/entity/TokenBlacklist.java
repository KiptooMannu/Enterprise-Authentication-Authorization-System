package com.authcore.authcore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "token_blacklist")
public class TokenBlacklist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 1024)
    private String token;

    @Column(nullable = false)
    private Instant expiry;

    public TokenBlacklist() {}

    public TokenBlacklist(String token, Instant expiry) {
        this.token = token;
        this.expiry = expiry;
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public Instant getExpiry() {
        return expiry;
    }
}
