package com.medwise.medwise.service;

import com.medwise.medwise.config.ExaProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExaService {

    private static final Logger log = LoggerFactory.getLogger(ExaService.class);

    private final ExaProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ExaService(ExaProperties properties, RestClient exaRestClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = exaRestClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Public-web snippets for the health assistant. Empty if the key is missing or Exa fails.
     */
    public String searchContext(String userMessage) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            log.info("Exa skipped: API key is not configured");
            return "";
        }
        if (userMessage == null || userMessage.isBlank()) {
            return "";
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("query", "General public health information (not medical advice): " + userMessage.trim());
            body.put("type", "auto");
            body.put("numResults", Math.max(1, Math.min(properties.numResults(), 8)));
            body.put("contents", Map.of("highlights", true));

            String raw = restClient.post()
                    .uri(properties.baseUrl() + "/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-api-key", properties.apiKey())
                    .header("Authorization", "Bearer " + properties.apiKey())
                    .body(body)
                    .retrieve()
                    .body(String.class);
            if (raw == null || raw.isBlank()) {
                return "";
            }
            return formatResults(objectMapper.readTree(raw));
        } catch (Exception ex) {
            log.warn("Exa search failed: {}", ex.getMessage());
            return "";
        }
    }

    static String formatResults(JsonNode root) {
        JsonNode results = root.path("results");
        if (!results.isArray() || results.isEmpty()) {
            return "";
        }
        List<String> lines = new ArrayList<>();
        int i = 0;
        for (JsonNode item : results) {
            if (i++ >= 5) {
                break;
            }
            String title = item.path("title").asText("");
            String url = item.path("url").asText("");
            String snippet = firstSnippet(item);
            if (title.isBlank() && snippet.isBlank()) {
                continue;
            }
            lines.add("- " + title + " (" + url + "): " + snippet);
        }
        if (lines.isEmpty()) {
            return "";
        }
        return String.join("\n", lines);
    }

    private static String firstSnippet(JsonNode item) {
        JsonNode highlights = item.path("highlights");
        if (highlights.isArray() && !highlights.isEmpty()) {
            return highlights.get(0).asText("");
        }
        String text = item.path("text").asText("");
        if (text.length() > 400) {
            return text.substring(0, 400) + "…";
        }
        return text;
    }
}
