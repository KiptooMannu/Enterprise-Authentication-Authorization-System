package com.authcore.authcore.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void generateSecretShouldReturnBase32String() {
        String secret = totpService.generateSecret();

        assertNotNull(secret);
        assertTrue(secret.matches("[A-Z2-7]+"), "secret should be base32 encoded");
        assertTrue(secret.length() >= 32, "160-bit secret should encode to at least 32 chars");
    }

    @Test
    void generateSecretShouldProduceDistinctValues() {
        assertNotEquals(totpService.generateSecret(), totpService.generateSecret());
    }

    @Test
    void buildOtpAuthUriShouldContainSecretIssuerAndUrlEncodedLabel() {
        String uri = totpService.buildOtpAuthUri("SECRET123", "jane@example.com", "Auth Core");

        assertTrue(uri.startsWith("otpauth://totp/"));
        assertTrue(uri.contains("secret=SECRET123"));
        assertTrue(uri.contains("issuer=Auth%20Core"));
        assertTrue(uri.contains("digits=6"));
        assertTrue(uri.contains("period=30"));
        // label is "issuer:accountEmail" url-encoded; '@' becomes %40, ':' becomes %3A
        assertTrue(uri.contains("Auth%20Core%3Ajane%40example.com"));
    }

    @Test
    void verifyCodeShouldRejectNullInputs() {
        assertFalse(totpService.verifyCode(null, "123456"));
        assertFalse(totpService.verifyCode("SECRET", null));
    }

    @Test
    void verifyCodeShouldRejectMalformedCode() {
        String secret = totpService.generateSecret();
        assertFalse(totpService.verifyCode(secret, "12345"));   // too short
        assertFalse(totpService.verifyCode(secret, "1234567")); // too long
        assertFalse(totpService.verifyCode(secret, "abcdef"));  // non-numeric
    }

    @Test
    void verifyCodeShouldAcceptCurrentlyGeneratedCode() {
        String secret = totpService.generateSecret();
        String code = TestTotpGenerator.currentCode(secret);

        assertTrue(totpService.verifyCode(secret, code));
    }

    @Test
    void verifyCodeShouldTrimWhitespaceAroundValidCode() {
        String secret = totpService.generateSecret();
        String code = TestTotpGenerator.currentCode(secret);

        assertTrue(totpService.verifyCode(secret, "  " + code + "  "));
    }

    @Test
    void verifyCodeShouldRejectWrongCode() {
        String secret = totpService.generateSecret();
        String code = TestTotpGenerator.currentCode(secret);
        String wrong = code.equals("000000") ? "111111" : "000000";

        assertFalse(totpService.verifyCode(secret, wrong));
    }
}
