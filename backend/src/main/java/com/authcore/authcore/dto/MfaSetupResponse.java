package com.authcore.authcore.dto;

public record MfaSetupResponse(
        String secret,
        String otpAuthUri
) {
}
