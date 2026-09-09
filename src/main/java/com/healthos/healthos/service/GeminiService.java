package com.healthos.healthos.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.healthos.healthos.config.GeminiProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String SAFETY_RULES = """
            You are HealthOS, an information and safety-support tool. You are not a doctor.
            Never diagnose. Never invent a dose or treatment instruction.
            Never tell the user to stop a prescribed medication.
            Never claim a medicine or water sample is definitely safe for a specific person.
            Always use cautious, general language. Reply with JSON only, no markdown.
            """;

    private final GeminiProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiService(GeminiProperties properties, RestClient geminiRestClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = geminiRestClient;
        this.objectMapper = objectMapper;
    }

    public Optional<JsonNode> generateJson(String prompt, byte[] imageBytes, String mimeType) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            log.info("Gemini skipped: API key is not configured");
            return Optional.empty();
        }
        try {
            Map<String, Object> body = buildRequest(prompt, imageBytes, mimeType);
            String url = properties.baseUrl()
                    + "/models/"
                    + properties.model()
                    + ":generateContent?key="
                    + properties.apiKey();
            String raw = restClient.post()
                    .uri(url)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            if (raw == null || raw.isBlank()) {
                return Optional.empty();
            }
            JsonNode root = objectMapper.readTree(raw);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                log.warn("Gemini returned no text");
                return Optional.empty();
            }
            String jsonText = stripFences(textNode.asText());
            return Optional.of(objectMapper.readTree(jsonText));
        } catch (Exception ex) {
            log.warn("Gemini call failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private Map<String, Object> buildRequest(String prompt, byte[] imageBytes, String mimeType) {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", SAFETY_RULES + "\n" + prompt));
        if (imageBytes != null && imageBytes.length > 0) {
            Map<String, Object> inline = new LinkedHashMap<>();
            inline.put("mime_type", mimeType == null || mimeType.isBlank() ? "image/jpeg" : mimeType);
            inline.put("data", java.util.Base64.getEncoder().encodeToString(imageBytes));
            parts.add(Map.of("inline_data", inline));
        }
        Map<String, Object> content = Map.of("parts", parts);
        Map<String, Object> generationConfig = Map.of("responseMimeType", "application/json");
        return Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
        );
    }

    static String stripFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNl = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNl > 0 && lastFence > firstNl) {
                return trimmed.substring(firstNl + 1, lastFence).trim();
            }
        }
        return trimmed;
    }
}
