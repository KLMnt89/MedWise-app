package com.medwise.medwise.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "medwise")
public record MedwiseProperties(
        String disclaimer,
        Long defaultUserId,
        String corsAllowedOriginPatterns
) {
}
