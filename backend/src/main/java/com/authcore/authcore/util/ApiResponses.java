package com.authcore.authcore.util;

import java.util.Map;

/**
 * Factory helpers for the small JSON response bodies returned across the API,
 * keeping the {@code error} / {@code status} / {@code message} shapes consistent.
 */
public final class ApiResponses {

    private ApiResponses() {
    }

    /**
     * {@code {"error": message}} — used for error responses.
     */
    public static Map<String, String> error(String message) {
        return Map.of("error", message);
    }

    /**
     * {@code {"status": status}} — a bare status body.
     */
    public static Map<String, String> status(String status) {
        return Map.of("status", status);
    }

    /**
     * {@code {"status": status, "message": message}}.
     */
    public static Map<String, String> message(String status, String message) {
        return Map.of("status", status, "message", message);
    }

    /**
     * {@code {"status": "success", "message": message}}.
     */
    public static Map<String, String> success(String message) {
        return message("success", message);
    }
}
