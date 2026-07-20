package com.authcore.authcore.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Shared helpers for extracting information from incoming HTTP requests.
 */
public final class HttpRequestUtils {

    private static final String BEARER_PREFIX = "Bearer ";

    private HttpRequestUtils() {
    }

    /**
     * Resolves the originating client IP, honouring the first entry of the
     * {@code X-Forwarded-For} header when present and falling back to the
     * remote address of the request.
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String[] ips = xForwardedFor.split(",");
            if (ips.length > 0) {
                String trimmedIp = ips[0].trim();
                if (!trimmedIp.isEmpty()) {
                    return trimmedIp;
                }
            }
        }
        return request.getRemoteAddr();
    }

    /**
     * Extracts the bearer token from the {@code Authorization} header of the
     * given request, or {@code null} if no bearer token is present.
     */
    public static String extractBearerToken(HttpServletRequest request) {
        return extractBearerToken(request.getHeader("Authorization"));
    }

    /**
     * Extracts the bearer token from a raw {@code Authorization} header value,
     * or {@code null} if the value is missing or not a bearer token.
     */
    public static String extractBearerToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
