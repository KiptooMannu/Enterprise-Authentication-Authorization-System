package com.authcore.authcore.dto;

public record LoginResponse(
        String token,
        String refreshToken,
        String message,
        boolean mfaRequired,
        String mfaChallengeToken
) {
    public static LoginResponse success(String token, String refreshToken) {
        return new LoginResponse(token, refreshToken, "success", false, null);
    }

    public static LoginResponse mfaRequired(String mfaChallengeToken) {
        return new LoginResponse(null, null, "mfa_required", true, mfaChallengeToken);
    }
}
