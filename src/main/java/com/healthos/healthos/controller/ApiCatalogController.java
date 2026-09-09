package com.healthos.healthos.controller;

import com.healthos.healthos.config.HealthosProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class ApiCatalogController {

    private final HealthosProperties properties;

    public ApiCatalogController(HealthosProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/api")
    public Map<String, Object> catalog() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "healthos");
        body.put("disclaimer", properties.disclaimer());
        body.put("endpoints", List.of(
                endpoint("GET", "/api/health", "Liveness. Includes whether EXA_API_KEY is set."),
                endpoint("GET", "/api/dashboard", "Health score and today's medicine/blood/water summary."),
                endpoint("POST", "/api/medicine/scan", "Multipart: name and/or image. Image-only uses local rules."),
                endpoint("POST", "/api/medicine/{id}/taken", "Mark a medicine as taken."),
                endpoint("GET", "/api/medicine", "Medicine history for the default user."),
                endpoint("POST", "/api/blood/scan", "Multipart: values JSON string and/or image. Image-only uses local rules."),
                endpoint("GET", "/api/blood", "Blood report history."),
                endpoint("POST", "/api/water/check", "JSON: ph, tds, chlorine."),
                endpoint("GET", "/api/water", "Water check history."),
                endpoint("POST", "/api/chat", "JSON: {\"message\":\"...\"}. Uses Exa, then local fallback."),
                endpoint("GET", "/api/chat", "Chat history (same as GET /api/chat/history).")
        ));
        return body;
    }

    private static Map<String, String> endpoint(String method, String path, String summary) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("method", method);
        row.put("path", path);
        row.put("summary", summary);
        return row;
    }
}
