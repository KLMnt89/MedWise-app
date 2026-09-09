package com.healthos.healthos.service;

import com.healthos.healthos.config.HealthosProperties;
import com.healthos.healthos.dto.ChatMessageResponse;
import com.healthos.healthos.entity.BloodReport;
import com.healthos.healthos.entity.ChatMessage;
import com.healthos.healthos.entity.Medicine;
import com.healthos.healthos.entity.WaterCheck;
import com.healthos.healthos.repository.BloodReportRepository;
import com.healthos.healthos.repository.ChatMessageRepository;
import com.healthos.healthos.repository.MedicineRepository;
import com.healthos.healthos.repository.WaterCheckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final MedicineRepository medicineRepository;
    private final BloodReportRepository bloodReportRepository;
    private final WaterCheckRepository waterCheckRepository;
    private final ExaService exaService;
    private final CurrentUserService currentUserService;
    private final HealthosProperties properties;

    public ChatService(
            ChatMessageRepository chatMessageRepository,
            MedicineRepository medicineRepository,
            BloodReportRepository bloodReportRepository,
            WaterCheckRepository waterCheckRepository,
            ExaService exaService,
            CurrentUserService currentUserService,
            HealthosProperties properties
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.medicineRepository = medicineRepository;
        this.bloodReportRepository = bloodReportRepository;
        this.waterCheckRepository = waterCheckRepository;
        this.exaService = exaService;
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
                Search and answer from public sources if useful. Treat the web as unverified background, not clinical evidence.
                Return JSON: {"reply": string}
                Give one clear next step in everyday language. Do not diagnose or change prescribed treatment.
                """.formatted(message, context);

        String reply = exaService.chatReply(prompt);
        String source;
        if (reply == null || reply.isBlank()) {
            reply = fallbackReply();
            source = "LOCAL_FALLBACK";
        } else {
            source = "EXA";
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
