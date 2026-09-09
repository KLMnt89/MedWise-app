package com.medwise.medwise.dto;

import jakarta.validation.constraints.NotNull;

public record WaterCheckRequest(
        @NotNull Double ph,
        @NotNull Double tds,
        @NotNull Double chlorine
) {
}
