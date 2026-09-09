package com.medwise.medwise.dto;

import java.time.Instant;

public record WaterCheckResponse(
        Long id,
        Double ph,
        Double tds,
        Double chlorine,
        String verdict,
        String triggeredBy,
        String explanation,
        String source,
        boolean fallback,
        Instant createdAt,
        String disclaimer
) {
}
