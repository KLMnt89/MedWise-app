package com.medwise.medwise.service;

import tools.jackson.databind.JsonNode;
import com.medwise.medwise.config.MedwiseProperties;
import com.medwise.medwise.dto.WaterCheckRequest;
import com.medwise.medwise.dto.WaterCheckResponse;
import com.medwise.medwise.entity.WaterCheck;
import com.medwise.medwise.repository.WaterCheckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class WaterService {

    private final WaterCheckRepository waterCheckRepository;
    private final GeminiService geminiService;
    private final FallbackRules fallbackRules;
    private final CurrentUserService currentUserService;
    private final MedwiseProperties properties;

    public WaterService(
            WaterCheckRepository waterCheckRepository,
            GeminiService geminiService,
            FallbackRules fallbackRules,
            CurrentUserService currentUserService,
            MedwiseProperties properties
    ) {
        this.waterCheckRepository = waterCheckRepository;
        this.geminiService = geminiService;
        this.fallbackRules = fallbackRules;
        this.currentUserService = currentUserService;
        this.properties = properties;
    }

    @Transactional
    public WaterCheckResponse check(WaterCheckRequest request) {
        String prompt = """
                Explain these drinking-water readings in plain language.
                pH=%s, TDS=%s, chlorine=%s.
                Return JSON: {"verdict":"safe"|"caution", "triggeredBy": string or null, "explanation": string}
                Do not claim the water is definitely safe for a specific person.
                """.formatted(request.ph(), request.tds(), request.chlorine());
        Optional<JsonNode> ai = geminiService.generateJson(prompt, null, null);

        WaterCheck entity = new WaterCheck();
        entity.setUserId(currentUserService.id());
        entity.setPh(request.ph());
        entity.setTds(request.tds());
        entity.setChlorine(request.chlorine());
        entity.setCreatedAt(Instant.now());
        if (ai.isPresent()) {
            JsonNode node = ai.get();
            String verdict = node.path("verdict").asText("caution");
            if (!"safe".equalsIgnoreCase(verdict) && !"caution".equalsIgnoreCase(verdict)) {
                verdict = "caution";
            }
            entity.setVerdict(verdict.toLowerCase());
            String triggered = node.path("triggeredBy").asText(null);
            entity.setTriggeredBy(triggered == null || triggered.isBlank() || "null".equals(triggered) ? null : triggered);
            entity.setExplanation(node.path("explanation").asText("General information only."));
            entity.setSource("GEMINI");
        } else {
            FallbackRules.WaterFallback fallback = fallbackRules.water(request.ph(), request.tds(), request.chlorine());
            entity.setVerdict(fallback.verdict());
            entity.setTriggeredBy(fallback.triggeredBy());
            entity.setExplanation(fallback.explanation());
            entity.setSource("LOCAL_FALLBACK");
        }
        return toResponse(waterCheckRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<WaterCheckResponse> list() {
        return waterCheckRepository.findByUserIdOrderByCreatedAtDesc(currentUserService.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public WaterCheckResponse toResponse(WaterCheck check) {
        return new WaterCheckResponse(
                check.getId(),
                check.getPh(),
                check.getTds(),
                check.getChlorine(),
                check.getVerdict(),
                check.getTriggeredBy(),
                check.getExplanation(),
                check.getSource(),
                "LOCAL_FALLBACK".equals(check.getSource()),
                check.getCreatedAt(),
                properties.disclaimer()
        );
    }
}
