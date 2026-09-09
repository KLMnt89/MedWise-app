package com.medwise.medwise.service;

import tools.jackson.databind.JsonNode;
import com.medwise.medwise.config.MedwiseProperties;
import com.medwise.medwise.dto.ChatMessageResponse;
import com.medwise.medwise.entity.BloodReport;
import com.medwise.medwise.entity.ChatMessage;
import com.medwise.medwise.entity.Medicine;
import com.medwise.medwise.entity.WaterCheck;
import com.medwise.medwise.repository.BloodReportRepository;
import com.medwise.medwise.repository.ChatMessageRepository;
import com.medwise.medwise.repository.MedicineRepository;
import com.medwise.medwise.repository.WaterCheckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MedicineRepository medicineRepository;
    private final BloodReportRepository bloodReportRepository;
    private final WaterCheckRepository waterCheckRepository;
    private final GeminiService geminiService;
    private final CurrentUserService currentUserService;
    private final MedwiseProperties properties;

    public ChatService(
            ChatMessageRepository chatMessageRepository,
            MedicineRepository medicineRepository,
            BloodReportRepository bloodReportRepository,
            WaterCheckRepository waterCheckRepository,
            GeminiService geminiService,
            CurrentUserService currentUserService,
            MedwiseProperties properties
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.medicineRepository = medicineRepository;
        this.bloodReportRepository = bloodReportRepository;
        this.waterCheckRepository = waterCheckRepository;
        this.geminiService = geminiService;
        this.currentUserService = currentUserService;
        this.properties = properties;
    }

    @Transactional
    public ChatMessageResponse chat(String message) {
        Long userId = currentUserService.id();
        save(userId, "USER", message, "USER");

        String context = buildHistoryContext(userId);
        String prompt = """
                The user asked: %s
                Use this history context (last 6 months; recent entries in full, older ones summarized):
                %s
                Return JSON: {"reply": string}
                Give one clear next step in everyday language. Do not diagnose or change prescribed treatment.
                """.formatted(message, context);

        Optional<JsonNode> ai = geminiService.generateJson(prompt, null, null);
        String reply;
        String source;
        if (ai.isPresent()) {
            reply = ai.get().path("reply").asText();
            if (reply.isBlank()) {
                reply = fallbackReply();
                source = "LOCAL_FALLBACK";
            } else {
                source = "GEMINI";
            }
        } else {
            reply = fallbackReply();
            source = "LOCAL_FALLBACK";
        }
        ChatMessage assistant = save(userId, "ASSISTANT", reply, source);
        return toResponse(assistant);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> history() {
        return chatMessageRepository.findByUserIdOrderByCreatedAtAsc(currentUserService.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ChatMessageResponse toResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getSource(),
                "LOCAL_FALLBACK".equals(message.getSource()),
                message.getCreatedAt(),
                properties.disclaimer()
        );
    }

    private ChatMessage save(Long userId, String role, String content, String source) {
        ChatMessage message = new ChatMessage();
        message.setUserId(userId);
        message.setRole(role);
        message.setContent(content);
        message.setSource(source);
        message.setCreatedAt(Instant.now());
        return chatMessageRepository.save(message);
    }

    private String buildHistoryContext(Long userId) {
        Instant sixMonths = Instant.now().minus(180, ChronoUnit.DAYS);
        Instant recent = Instant.now().minus(14, ChronoUnit.DAYS);

        List<Medicine> medicines = medicineRepository.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(userId, sixMonths);
        List<BloodReport> blood = bloodReportRepository.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(userId, sixMonths);
        List<WaterCheck> water = waterCheckRepository.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(userId, sixMonths);

        StringBuilder sb = new StringBuilder();
        sb.append("Recent medicines (14 days):\n");
        medicines.stream().filter(item -> !item.getCreatedAt().isBefore(recent))
                .forEach(item -> sb.append("- ").append(item.getName()).append(" | ").append(item.getPurpose())
                        .append(" | last taken ").append(item.getLastTakenAt()).append('\n'));
        sb.append("Older medicines summary: ")
                .append(medicines.stream().filter(item -> item.getCreatedAt().isBefore(recent))
                        .map(Medicine::getName).distinct().collect(Collectors.joining(", ")))
                .append('\n');

        sb.append("Recent blood reports (14 days):\n");
        blood.stream().filter(item -> !item.getCreatedAt().isBefore(recent))
                .forEach(item -> sb.append("- ").append(item.getSummary()).append('\n'));
        long olderBlood = blood.stream().filter(item -> item.getCreatedAt().isBefore(recent)).count();
        sb.append("Older blood reports in window: ").append(olderBlood).append('\n');

        sb.append("Recent water checks (14 days):\n");
        water.stream().filter(item -> !item.getCreatedAt().isBefore(recent))
                .forEach(item -> sb.append("- verdict ").append(item.getVerdict())
                        .append(" pH=").append(item.getPh())
                        .append(" TDS=").append(item.getTds())
                        .append(" chlorine=").append(item.getChlorine()).append('\n'));
        long cautionOlder = water.stream()
                .filter(item -> item.getCreatedAt().isBefore(recent))
                .filter(item -> "caution".equalsIgnoreCase(item.getVerdict()))
                .count();
        sb.append("Older water cautions in window: ").append(cautionOlder).append('\n');
        return sb.toString();
    }

    private String fallbackReply() {
        return "AI unavailable, showing basic analysis. Review today's medicines, the latest blood flags, and the latest water check on your dashboard, then ask a clinician about anything that looks off. "
                + properties.disclaimer();
    }
}
