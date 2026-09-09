package com.medwise.medwise.dto;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        String role,
        String content,
        String source,
        boolean fallback,
        Instant createdAt,
        String disclaimer
) {
}
