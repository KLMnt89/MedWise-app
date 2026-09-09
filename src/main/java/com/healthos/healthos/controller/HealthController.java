package com.healthos.healthos.controller;

import com.healthos.healthos.config.ExaProperties;
import com.healthos.healthos.dto.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final ExaProperties exaProperties;

    public HealthController(ExaProperties exaProperties) {
        this.exaProperties = exaProperties;
    }

    @GetMapping({"/", "/api/health"})
    public HealthResponse health() {
        boolean exa = exaProperties.apiKey() != null && !exaProperties.apiKey().isBlank();
        return new HealthResponse("ok", "healthos", exa);
    }
}
