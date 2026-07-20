package com.authcore.authcore.integration;

import com.authcore.authcore.dto.LoginRequest;
import com.authcore.authcore.dto.UserRegistrationRequest;
import com.authcore.authcore.security.AuthResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AdminAuthorizationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    public void adminCanAccessAdminEndpoints() {
        // login existing admin created at startup
        LoginRequest login = new LoginRequest("admin@example.com", "Admin123!", null, null, null, null, null, null);
        ResponseEntity<AuthResponse> authResponse = restTemplate.postForEntity("/api/users/login", login, AuthResponse.class);
        assertEquals(HttpStatus.OK, authResponse.getStatusCode());
        AuthResponse body = authResponse.getBody();
        assertNotNull(body);
        String token = body != null ? body.token() : "";
        assertNotNull(token, "Token should not be null");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> listUsers = restTemplate.exchange("/api/admin/users", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, listUsers.getStatusCode());

        ResponseEntity<String> protectedAdmin = restTemplate.exchange("/api/protected/admin", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, protectedAdmin.getStatusCode());
    }

    @Test
    public void normalUserCannotAccessAdminEndpoints() {
        String uniqueUser = "bob_" + System.currentTimeMillis();
        String uniqueEmail = uniqueUser + "@example.com";
        UserRegistrationRequest registration = new UserRegistrationRequest(uniqueUser, uniqueEmail, "Password123!");
        ResponseEntity<String> createResponse = restTemplate.postForEntity("/api/users/register", registration, String.class);
        assertEquals(HttpStatus.CREATED, createResponse.getStatusCode());

        LoginRequest login = new LoginRequest(uniqueEmail, "Password123!", null, null, null, null, null, null);
        ResponseEntity<AuthResponse> authResponse = restTemplate.postForEntity("/api/users/login", login, AuthResponse.class);
        assertEquals(HttpStatus.OK, authResponse.getStatusCode());
        AuthResponse body = authResponse.getBody();
        assertNotNull(body);
        String token = body != null ? body.token() : "";
        assertNotNull(token, "Token should not be null");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        ResponseEntity<String> listUsers = restTemplate.exchange("/api/admin/users", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertTrue(listUsers.getStatusCode().is4xxClientError());

        ResponseEntity<String> protectedAdmin = restTemplate.exchange("/api/protected/admin", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertTrue(protectedAdmin.getStatusCode().is4xxClientError());
    }
}
