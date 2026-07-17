package com.authcore.authcore.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Locale;

/**
 * RFC 6238 (TOTP) / RFC 4226 (HOTP) implementation using only the JDK's built-in
 * HmacSHA1 support, so no extra Maven dependency is required.
 */
@Service
public class TotpService {

    private static final int SECRET_BYTES = 20; // 160 bits, standard for TOTP
    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int ALLOWED_DRIFT_STEPS = 1; // accept 1 step early/late for clock drift
    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom secureRandom = new SecureRandom();

    /** Generates a new random base32-encoded secret. */
    public String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        secureRandom.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /** Builds the otpauth:// URI that authenticator apps use to import the secret. */
    public String buildOtpAuthUri(String secret, String accountEmail, String issuer) {
        String encodedIssuer = urlEncode(issuer);
        String label = urlEncode(issuer + ":" + accountEmail);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1&digits=" + CODE_DIGITS + "&period=" + TIME_STEP_SECONDS;
    }

    /** Verifies a 6-digit code against the given secret, allowing for minor clock drift. */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        String normalizedCode = code.trim();
        if (!normalizedCode.matches("\\d{6}")) {
            return false;
        }
        long currentStep = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;
        byte[] key = base32Decode(secret);
        for (int drift = -ALLOWED_DRIFT_STEPS; drift <= ALLOWED_DRIFT_STEPS; drift++) {
            String expected = generateCode(key, currentStep + drift);
            if (expected.equals(normalizedCode)) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(byte[] key, long timeStep) {
        byte[] data = new byte[8];
        long value = timeStep;
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % 1_000_000;
            return String.format(Locale.ROOT, "%06d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute TOTP code", e);
        }
    }

    private String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int bits = 0;
        int value = 0;
        for (byte b : data) {
            value = (value << 8) | (b & 0xFF);
            bits += 8;
            while (bits >= 5) {
                sb.append(BASE32_ALPHABET.charAt((value >>> (bits - 5)) & 0x1F));
                bits -= 5;
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPHABET.charAt((value << (5 - bits)) & 0x1F));
        }
        return sb.toString();
    }

    private byte[] base32Decode(String encoded) {
        String cleaned = encoded.trim().toUpperCase(Locale.ROOT).replace("=", "");
        int bits = 0;
        int value = 0;
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        for (char c : cleaned.toCharArray()) {
            int idx = BASE32_ALPHABET.indexOf(c);
            if (idx < 0) {
                continue;
            }
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                out.write((value >>> (bits - 8)) & 0xFF);
                bits -= 8;
            }
        }
        return out.toByteArray();
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
