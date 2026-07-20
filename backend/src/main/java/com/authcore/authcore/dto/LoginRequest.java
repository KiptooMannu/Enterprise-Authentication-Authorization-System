package com.authcore.authcore.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        Double latitude,
        Double longitude,
        Double accuracy,
        Double altitude,
        Double heading,
        Double speed
) {
}
