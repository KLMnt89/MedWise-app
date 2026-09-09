package com.healthos.healthos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "healthos")
public record HealthosProperties(
        String disclaimer,
        Long defaultUserId,
        String corsAllowedOriginPatterns
) {
}
