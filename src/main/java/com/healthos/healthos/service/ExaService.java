package com.healthos.healthos.service;

import com.healthos.healthos.config.ExaProperties;
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
import java.util.Optional;

@Service
public class ExaService {

    private static final Logger log = LoggerFactory.getLogger(ExaService.class);
    private static final String SAFETY = """
            You are HealthOS, an information and safety-support tool. You are not a doctor.
            Never diagnose. Never invent a dose or treatment instruction.
            Never tell the user to stop a prescribed medication.
            Never claim a medicine or water sample is definitely safe for a specific person.
            Use cautious, general language. Public web sources are unverified background, not clinical evidence.
            """;

    private final ExaProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ExaService(ExaProperties properties, RestClient exaRestClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = exaRestClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Chat reply from Exa: JSON.reply if present, otherwise the raw answer text.
     */
    public String chatReply(String prompt) {
        String raw = answer(prompt);
        if (raw == null || raw.isBlank()) {
            return "";
        }
        Optional<JsonNode> parsed = parseJsonFromAnswer(objectMapper, raw);
        if (parsed.isPresent()) {
            String reply = parsed.get().path("reply").asText("");
            if (!reply.isBlank()) {
                return reply;
            }
        }
        return raw;
    }

    /**
     * Structured JSON for scans. Empty if the key is missing or Exa fails.
     */
    public Optional<JsonNode> generateJson(String prompt) {
        String answer = answer(prompt);
        if (answer == null || answer.isBlank()) {
            return Optional.empty();
        }
        return parseJsonFromAnswer(objectMapper, answer);
    }

    public String answer(String prompt) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            log.info("Exa skipped: API key is not configured");
            return "";
        }
        if (prompt == null || prompt.isBlank()) {
            return "";
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("query", SAFETY + "\n" + prompt.trim() + "\nReply with JSON only. No markdown.");
            body.put("text", true);

            String raw = restClient.post()
                    .uri(properties.baseUrl() + "/answer")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-api-key", properties.apiKey())
                    .header("Authorization", "Bearer " + properties.apiKey())
                    .body(body)
                    .retrieve()
                    .body(String.class);
            if (raw == null || raw.isBlank()) {
                return "";
            }
            JsonNode root = objectMapper.readTree(raw);
            String text = root.path("answer").asText("");
            if (text.isBlank()) {
                text = formatResults(root);
            }
            return text;
        } catch (Exception ex) {
            log.warn("Exa answer failed: {}", ex.getMessage());
            return "";
        }
    }

    public String searchContext(String userMessage) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
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

    static Optional<JsonNode> parseJsonFromAnswer(ObjectMapper mapper, String answer) {
        String trimmed = stripFences(answer);
        try {
            return Optional.of(mapper.readTree(trimmed));
        } catch (Exception ignored) {
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try {
                    return Optional.of(mapper.readTree(trimmed.substring(start, end + 1)));
                } catch (Exception ignoredAgain) {
                    return Optional.empty();
                }
            }
            return Optional.empty();
        }
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
