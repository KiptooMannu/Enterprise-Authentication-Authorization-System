package com.authcore.authcore.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtService() {
        this("0123456789abcdef0123456789abcdef");
    }

    public JwtService(String secret) {
        this.algorithm = Algorithm.HMAC256(secret.getBytes(StandardCharsets.UTF_8));
        this.verifier = JWT.require(algorithm).build();
    }

    public String generateToken(String username) {
        return JWT.create()
            .withSubject(username)
            .withIssuedAt(new Date())
            .withExpiresAt(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
            .sign(algorithm);
    }

    public String extractUsername(String token) {
        DecodedJWT decoded = verifier.verify(token);
        return decoded.getSubject();
    }

    public boolean isTokenValid(String token, String username) {
        try {
            String extracted = extractUsername(token);
            return username.equals(extracted) && !isTokenExpired(token);
        } catch (Exception ex) {
            // An unverifiable/expired token is simply not valid; keep the detail at debug level.
            log.debug("Token validation failed: {}", ex.getMessage());
            return false;
        }
    }

    public java.util.Date extractExpiration(String token) {
        DecodedJWT decoded = verifier.verify(token);
        return decoded.getExpiresAt();
    }

    private boolean isTokenExpired(String token) {
        DecodedJWT decoded = verifier.verify(token);
        return decoded.getExpiresAt().before(new Date());
    }
}
