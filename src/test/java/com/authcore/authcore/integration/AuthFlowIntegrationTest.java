package com.authcore.authcore.integration;

import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.security.AuthResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AuthFlowIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void fullAuthFlow() {
        // register
        UserRegistrationRequest reg = new UserRegistrationRequest("alice", "alice@example.com", "password");
        ResponseEntity<String> r1 = restTemplate.postForEntity("/api/users/register", reg, String.class);
        assertTrue(r1.getStatusCode().is2xxSuccessful());

        // login
        LoginRequest login = new LoginRequest("alice@example.com", "password");
        ResponseEntity<AuthResponse> loginResp = restTemplate.postForEntity("/api/users/login", login, AuthResponse.class);
        assertEquals(HttpStatus.OK, loginResp.getStatusCode());
        AuthResponse tokens = loginResp.getBody();
        assertNotNull(tokens);
        assertNotNull(tokens.token());
        assertNotNull(tokens.refreshToken());

        String access = tokens.token();
        String refresh = tokens.refreshToken();

        // access protected endpoint
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(access);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> protectedResp = restTemplate.exchange("/api/protected/me", HttpMethod.GET, entity, String.class);
        System.out.println("protected status=" + protectedResp.getStatusCode() + " body=" + protectedResp.getBody());
        assertEquals(HttpStatus.OK, protectedResp.getStatusCode());
        assertTrue(protectedResp.getBody().contains("alice@example.com") || protectedResp.getBody().contains("alice"));

        // refresh
        ResponseEntity<AuthResponse> refreshed = restTemplate.postForEntity("/api/auth/refresh", Map.of("refreshToken", refresh), AuthResponse.class);
        assertEquals(HttpStatus.OK, refreshed.getStatusCode());
        AuthResponse newTokens = refreshed.getBody();
        assertNotNull(newTokens);
        assertNotEquals(access, newTokens.token());
        assertNotNull(newTokens.refreshToken());

        // revoke old access token
        ResponseEntity<Map> revokeResp = restTemplate.postForEntity("/api/auth/revoke", Map.of("token", access, "type", "access"), Map.class);
        assertEquals(HttpStatus.OK, revokeResp.getStatusCode());

        // old access should be rejected
        ResponseEntity<String> protectedAfterRevoke = restTemplate.exchange("/api/protected/me", HttpMethod.GET, entity, String.class);
        assertTrue(protectedAfterRevoke.getStatusCode() == HttpStatus.UNAUTHORIZED || protectedAfterRevoke.getStatusCode() == HttpStatus.FORBIDDEN);

        // revoke refresh token
        ResponseEntity<Map> revokeRefresh = restTemplate.postForEntity("/api/auth/revoke", Map.of("token", newTokens.refreshToken(), "type", "refresh"), Map.class);
        assertEquals(HttpStatus.OK, revokeRefresh.getStatusCode());

        // trying to refresh with revoked token should fail
        ResponseEntity<Map> refreshFail = restTemplate.postForEntity("/api/auth/refresh", Map.of("refreshToken", newTokens.refreshToken()), Map.class);
        assertTrue(refreshFail.getStatusCode() == HttpStatus.UNAUTHORIZED || refreshFail.getStatusCode().is4xxClientError());
    }
}
