package com.authcore.authcore.service;

import com.authcore.authcore.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService("0123456789abcdef0123456789abcdef");

    @Test
    void shouldGenerateAndValidateToken() {
        String token = jwtService.generateToken("jane@example.com");

        assertNotNull(token);
        assertEquals("jane@example.com", jwtService.extractUsername(token));
        assertEquals(true, jwtService.isTokenValid(token, "jane@example.com"));
    }
}
