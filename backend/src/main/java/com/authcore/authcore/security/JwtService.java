package com.authcore.authcore.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_SECRET_LENGTH = 32;

    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtService(@Value("${JWT_SECRET:}") String secret) {
        this.algorithm = Algorithm.HMAC256(resolveSecret(secret).getBytes(StandardCharsets.UTF_8));
        this.verifier = JWT.require(algorithm).build();
    }

    private static String resolveSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            log.warn("JWT_SECRET is not configured. Generating an ephemeral random secret; "
                + "issued tokens will not survive a restart and instances will not share signing keys. "
                + "Set the JWT_SECRET environment variable to a strong value (>= {} characters) in production.",
                MIN_SECRET_LENGTH);
            byte[] random = new byte[MIN_SECRET_LENGTH];
            new SecureRandom().nextBytes(random);
            return Base64.getEncoder().encodeToString(random);
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                "JWT_SECRET must be at least " + MIN_SECRET_LENGTH + " characters long.");
        }
        return secret;
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
