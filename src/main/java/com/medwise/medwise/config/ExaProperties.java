package com.medwise.medwise.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exa")
public record ExaProperties(String apiKey, String baseUrl, int numResults) {
}
