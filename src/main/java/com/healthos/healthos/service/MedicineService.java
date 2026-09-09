package com.healthos.healthos.service;

import tools.jackson.databind.JsonNode;
import com.healthos.healthos.config.HealthosProperties;
import com.healthos.healthos.dto.MedicineResponse;
import com.healthos.healthos.entity.Medicine;
import com.healthos.healthos.repository.MedicineRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final GeminiService geminiService;
    private final FallbackRules fallbackRules;
    private final CurrentUserService currentUserService;
    private final HealthosProperties properties;

    public MedicineService(
            MedicineRepository medicineRepository,
            GeminiService geminiService,
            FallbackRules fallbackRules,
            CurrentUserService currentUserService,
            HealthosProperties properties
    ) {
        this.medicineRepository = medicineRepository;
        this.geminiService = geminiService;
        this.fallbackRules = fallbackRules;
        this.currentUserService = currentUserService;
        this.properties = properties;
    }

    @Transactional
    public MedicineResponse scan(String name, MultipartFile image) {
        byte[] bytes = ImagePayload.bytes(image);
        if ((name == null || name.isBlank()) && bytes == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a medicine name or an image");
        }
        String prompt = """
                Identify the medicine from the photo and/or this user-entered name: %s
                Return JSON with keys: name, purpose, dose, frequency, waterIntakeNote, explanation.
                dose and frequency must be general (pack/pharmacist/prescriber) — never invent a personal dose.
                """.formatted(name == null ? "" : name);

        Optional<JsonNode> ai = geminiService.generateJson(prompt, bytes, ImagePayload.mimeType(image));
        Medicine entity = new Medicine();
        entity.setUserId(currentUserService.id());
        if (ai.isPresent()) {
            JsonNode node = ai.get();
            entity.setName(text(node, "name", name));
            entity.setPurpose(text(node, "purpose", null));
            entity.setDose(text(node, "dose", "Follow the pack or a pharmacist"));
            entity.setFrequency(text(node, "frequency", "As labelled"));
            entity.setWaterIntakeNote(text(node, "waterIntakeNote", "Take with water unless a clinician advised otherwise."));
            entity.setExplanation(text(node, "explanation", "General information only."));
            entity.setSource("GEMINI");
        } else {
            FallbackRules.MedicineFallback fallback = fallbackRules.medicine(name);
            entity.setName(fallback.name());
            entity.setPurpose(fallback.purpose());
            entity.setDose(fallback.dose());
            entity.setFrequency(fallback.frequency());
            entity.setWaterIntakeNote(fallback.waterIntakeNote());
            entity.setExplanation(fallback.explanation());
            entity.setSource("LOCAL_FALLBACK");
        }
        entity.setCreatedAt(Instant.now());
        return toResponse(medicineRepository.save(entity));
    }

    @Transactional
    public MedicineResponse markTaken(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .filter(item -> item.getUserId().equals(currentUserService.id()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found"));
        medicine.setLastTakenAt(Instant.now());
        return toResponse(medicineRepository.save(medicine));
    }

    @Transactional(readOnly = true)
    public List<MedicineResponse> list() {
        return medicineRepository.findByUserIdOrderByCreatedAtDesc(currentUserService.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MedicineResponse toResponse(Medicine medicine) {
        boolean fallback = "LOCAL_FALLBACK".equals(medicine.getSource());
        return new MedicineResponse(
                medicine.getId(),
                medicine.getName(),
                medicine.getPurpose(),
                medicine.getDose(),
                medicine.getFrequency(),
                medicine.getWaterIntakeNote(),
                medicine.getExplanation(),
                medicine.getSource(),
                fallback,
                medicine.getLastTakenAt(),
                medicine.getCreatedAt(),
                properties.disclaimer()
        );
    }

    private static String text(JsonNode node, String field, String fallback) {
        JsonNode value = node.get(field);
        if (value == null || value.asText().isBlank()) {
            return fallback;
        }
        return value.asText();
    }
}
