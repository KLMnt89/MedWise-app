package com.healthos.healthos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final HealthosProperties properties;

    public WebConfig(HealthosProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String patterns = properties.corsAllowedOriginPatterns() == null
                ? "*"
                : properties.corsAllowedOriginPatterns();
        registry.addMapping("/api/**")
                .allowedOriginPatterns(patterns.split("\\s*,\\s*"))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
