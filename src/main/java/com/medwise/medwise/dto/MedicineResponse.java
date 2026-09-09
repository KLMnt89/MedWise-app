package com.medwise.medwise.dto;

import java.time.Instant;

public record MedicineResponse(
        Long id,
        String name,
        String purpose,
        String dose,
        String frequency,
        String waterIntakeNote,
        String explanation,
        String source,
        boolean fallback,
        Instant lastTakenAt,
        Instant createdAt,
        String disclaimer
) {
}
