package com.authcore.authcore.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(nullable = true)
    private String ipAddress;

    @Column(nullable = true)
    private String userAgent;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public RefreshToken() {
    }

    public RefreshToken(String token, UserEntity user, Instant expiryDate) {
        this.token = token;
        this.user = user;
        this.expiryDate = expiryDate;
        this.createdAt = Instant.now();
    }

    public RefreshToken(String token, UserEntity user, Instant expiryDate, String ipAddress, String userAgent) {
        this.token = token;
        this.user = user;
        this.expiryDate = expiryDate;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public UserEntity getUser() {
        return user;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
