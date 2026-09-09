package com.medwise.medwise.dto;

import java.time.Instant;
import java.util.List;

public record BloodScanResponse(
        Long id,
        String summary,
        List<FlaggedValue> flaggedValues,
        List<String> recommendations,
        String source,
        boolean fallback,
        Instant createdAt,
        String disclaimer
) {
}
