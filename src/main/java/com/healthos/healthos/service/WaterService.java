package com.healthos.healthos.service;

import tools.jackson.databind.JsonNode;
import com.healthos.healthos.config.HealthosProperties;
import com.healthos.healthos.dto.WaterCheckResponse;
import com.healthos.healthos.entity.WaterCheck;
import com.healthos.healthos.repository.WaterCheckRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class WaterService {

    private final WaterCheckRepository waterCheckRepository;
    private final ExaService exaService;
    private final GeminiService geminiService;
    private final FallbackRules fallbackRules;
    private final CurrentUserService currentUserService;
    private final HealthosProperties properties;

    public WaterService(
            WaterCheckRepository waterCheckRepository,
            ExaService exaService,
            GeminiService geminiService,
            FallbackRules fallbackRules,
            CurrentUserService currentUserService,
            HealthosProperties properties
    ) {
        this.waterCheckRepository = waterCheckRepository;
        this.exaService = exaService;
        this.geminiService = geminiService;
        this.fallbackRules = fallbackRules;
        this.currentUserService = currentUserService;
        this.properties = properties;
    }

    @Transactional
    public WaterCheckResponse check(Double ph, Double tds, Double chlorine, MultipartFile image) {
        boolean hasReadings = ph != null && tds != null && chlorine != null;
        boolean hasImage = ImagePayload.bytes(image) != null;
        if (!hasReadings && !hasImage) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide pH, TDS, and chlorine, or a photo of the water");
        }
        if (hasReadings) {
            if (ph < 0 || ph > 14 || tds < 0 || tds > 10000 || chlorine < 0 || chlorine > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pH, TDS, or chlorine is outside the allowed range");
            }
        }

        WaterCheck entity = new WaterCheck();
        entity.setUserId(currentUserService.id());
        entity.setPh(ph);
        entity.setTds(tds);
        entity.setChlorine(chlorine);
        entity.setCreatedAt(Instant.now());

        if (!hasReadings) {
            String photoPrompt = """
                    Look at this photo of water or a water test strip.
                    Say what you notice and what you think about the water in plain language.
                    Return JSON: {"verdict":"safe"|"caution", "triggeredBy": string or null, "explanation": string}
                    Do not invent exact lab numbers unless they are clearly readable. Do not claim the water is definitely safe.
                    """;
            Optional<JsonNode> vision = geminiService.generateJson(
                    photoPrompt,
                    ImagePayload.bytes(image),
                    ImagePayload.mimeType(image)
            );
            if (applyAi(entity, vision, "GEMINI")) {
                return toResponse(waterCheckRepository.save(entity));
            }
            FallbackRules.WaterFallback fallback = fallbackRules.waterFromPhoto();
            entity.setVerdict(fallback.verdict());
            entity.setTriggeredBy(fallback.triggeredBy());
            entity.setExplanation(fallback.explanation());
            entity.setSource("LOCAL_FALLBACK");
            return toResponse(waterCheckRepository.save(entity));
        }

        String prompt = """
                Explain these drinking-water readings in plain language.
                pH=%s, TDS=%s, chlorine=%s.
                Return JSON: {"verdict":"safe"|"caution", "triggeredBy": string or null, "explanation": string}
                Do not claim the water is definitely safe for a specific person.
                """.formatted(ph, tds, chlorine);
        Optional<JsonNode> ai = exaService.generateJson(prompt);
        if (!applyAi(entity, ai, "EXA")) {
            FallbackRules.WaterFallback fallback = fallbackRules.water(ph, tds, chlorine);
            entity.setVerdict(fallback.verdict());
            entity.setTriggeredBy(fallback.triggeredBy());
            entity.setExplanation(fallback.explanation());
            entity.setSource("LOCAL_FALLBACK");
        }
        return toResponse(waterCheckRepository.save(entity));
    }

    private static boolean applyAi(WaterCheck entity, Optional<JsonNode> ai, String source) {
        if (ai.isEmpty() || !(ai.get().has("verdict") || ai.get().has("explanation"))) {
            return false;
        }
        JsonNode node = ai.get();
        String verdict = node.path("verdict").asText("caution");
        if (!"safe".equalsIgnoreCase(verdict) && !"caution".equalsIgnoreCase(verdict)) {
            verdict = "caution";
        }
        entity.setVerdict(verdict.toLowerCase());
        String triggered = node.path("triggeredBy").asText(null);
        entity.setTriggeredBy(triggered == null || triggered.isBlank() || "null".equals(triggered) ? null : triggered);
        entity.setExplanation(node.path("explanation").asText("General information only."));
        entity.setSource(source);
        return true;
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
