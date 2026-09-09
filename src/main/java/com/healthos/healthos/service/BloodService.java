package com.healthos.healthos.service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.healthos.healthos.config.HealthosProperties;
import com.healthos.healthos.dto.BloodScanResponse;
import com.healthos.healthos.dto.FlaggedValue;
import com.healthos.healthos.entity.BloodReport;
import com.healthos.healthos.repository.BloodReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BloodService {

    private final BloodReportRepository bloodReportRepository;
    private final ExaService exaService;
    private final FallbackRules fallbackRules;
    private final CurrentUserService currentUserService;
    private final HealthosProperties properties;
    private final ObjectMapper objectMapper;

    public BloodService(
            BloodReportRepository bloodReportRepository,
            ExaService exaService,
            FallbackRules fallbackRules,
            CurrentUserService currentUserService,
            HealthosProperties properties,
            ObjectMapper objectMapper
    ) {
        this.bloodReportRepository = bloodReportRepository;
        this.exaService = exaService;
        this.fallbackRules = fallbackRules;
        this.currentUserService = currentUserService;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public BloodScanResponse scan(String valuesJson, MultipartFile image) {
        Map<String, Double> manual = parseValues(valuesJson);
        byte[] bytes = ImagePayload.bytes(image);
        if (manual.isEmpty() && bytes == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide lab values JSON or an image");
        }
        String prompt = """
                Read the blood report photo if present. Manual values JSON: %s
                Flag values that look outside a general adult reference range.
                Return JSON: {"summary": string, "flaggedValues": [{"name": string, "value": string, "status": "high|low|normal|unknown", "note": string}], "recommendations": [string]}
                Recommendations must be short and non-diagnostic. Do not diagnose.
                """.formatted(valuesJson == null ? "{}" : valuesJson);

        Optional<JsonNode> ai = manual.isEmpty()
                ? Optional.empty()
                : exaService.generateJson(prompt);
        BloodReport entity = new BloodReport();
        entity.setUserId(currentUserService.id());
        entity.setCreatedAt(Instant.now());
        if (ai.isPresent() && ai.get().has("flaggedValues")) {
            JsonNode node = ai.get();
            entity.setSummary(node.path("summary").asText("General information from the report."));
            entity.setFlaggedJson(node.path("flaggedValues").toString());
            entity.setRecommendationsJson(node.path("recommendations").toString());
            entity.setSource("EXA");
        } else {
            FallbackRules.BloodFallback fallback = fallbackRules.blood(manual);
            entity.setSummary(fallback.summary());
            entity.setFlaggedJson(write(fallback.flaggedValues()));
            entity.setRecommendationsJson(write(fallback.recommendations()));
            entity.setSource("LOCAL_FALLBACK");
        }
        return toResponse(bloodReportRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<BloodScanResponse> list() {
        return bloodReportRepository.findByUserIdOrderByCreatedAtDesc(currentUserService.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BloodScanResponse toResponse(BloodReport report) {
        return new BloodScanResponse(
                report.getId(),
                report.getSummary(),
                readFlagged(report.getFlaggedJson()),
                readStrings(report.getRecommendationsJson()),
                report.getSource(),
                "LOCAL_FALLBACK".equals(report.getSource()),
                report.getCreatedAt(),
                properties.disclaimer()
        );
    }

    private Map<String, Double> parseValues(String valuesJson) {
        if (valuesJson == null || valuesJson.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, Object> raw = objectMapper.readValue(valuesJson, new TypeReference<>() {
            });
            Map<String, Double> parsed = new LinkedHashMap<>();
            raw.forEach((key, value) -> {
                if (value instanceof Number number) {
                    parsed.put(key, number.doubleValue());
                } else if (value != null) {
                    try {
                        parsed.put(key, Double.parseDouble(value.toString()));
                    } catch (NumberFormatException ignored) {
                        // skip non-numeric
                    }
                }
            });
            return parsed;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "values must be JSON like {\"glucose\": 7.2}");
        }
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private List<FlaggedValue> readFlagged(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            return List.of();
        }
    }

    private List<String> readStrings(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            return List.of();
        }
    }
}
