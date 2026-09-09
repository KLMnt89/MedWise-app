package com.healthos.healthos.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record WaterCheckRequest(
        @NotNull @DecimalMin("0.0") @DecimalMax("14.0") Double ph,
        @NotNull @DecimalMin("0.0") @DecimalMax("10000.0") Double tds,
        @NotNull @DecimalMin("0.0") @DecimalMax("20.0") Double chlorine
) {
}
