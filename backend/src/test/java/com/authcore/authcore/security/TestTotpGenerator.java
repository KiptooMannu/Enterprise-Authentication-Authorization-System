package com.authcore.authcore.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.util.Locale;

/**
 * Test-only reimplementation of the RFC 6238 TOTP algorithm used by {@link TotpService},
 * so tests can compute the code an authenticator app would currently produce for a secret.
 */
final class TestTotpGenerator {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int TIME_STEP_SECONDS = 30;

    private TestTotpGenerator() {
    }

    static String currentCode(String secret) {
        long step = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;
        return generateCode(base32Decode(secret), step);
    }

    private static String generateCode(byte[] key, long timeStep) {
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

    private static byte[] base32Decode(String encoded) {
        String cleaned = encoded.trim().toUpperCase(Locale.ROOT).replace("=", "");
        int bits = 0;
        int value = 0;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
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
}
