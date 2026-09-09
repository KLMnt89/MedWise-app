package com.healthos.healthos.config;

import com.healthos.healthos.entity.AppUser;
import com.healthos.healthos.entity.BloodReport;
import com.healthos.healthos.entity.ChatMessage;
import com.healthos.healthos.entity.Medicine;
import com.healthos.healthos.entity.WaterCheck;
import com.healthos.healthos.repository.BloodReportRepository;
import com.healthos.healthos.repository.ChatMessageRepository;
import com.healthos.healthos.repository.MedicineRepository;
import com.healthos.healthos.repository.UserRepository;
import com.healthos.healthos.repository.WaterCheckRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@ConditionalOnProperty(name = "healthos.seed-demo", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final BloodReportRepository bloodReportRepository;
    private final WaterCheckRepository waterCheckRepository;
    private final ChatMessageRepository chatMessageRepository;

    public DemoDataSeeder(
            UserRepository userRepository,
            MedicineRepository medicineRepository,
            BloodReportRepository bloodReportRepository,
            WaterCheckRepository waterCheckRepository,
            ChatMessageRepository chatMessageRepository
    ) {
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.bloodReportRepository = bloodReportRepository;
        this.waterCheckRepository = waterCheckRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppUser user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) {
            log.warn("Demo seed skipped: no user row");
            return;
        }
        if (medicineRepository.count() > 0) {
            return;
        }
        Long userId = user.getId();
        Instant now = Instant.now();

        Medicine medicine = new Medicine();
        medicine.setUserId(userId);
        medicine.setName("Paracetamol");
        medicine.setPurpose("Pain and fever relief (general pack information).");
        medicine.setDose("Follow the pack or a pharmacist — not a personal prescription.");
        medicine.setFrequency("As labelled");
        medicine.setWaterIntakeNote("Take with a glass of water unless a clinician advised otherwise.");
        medicine.setExplanation("Demo sample so the dashboard is not empty. Not a recommendation to take this medicine.");
        medicine.setSource("DEMO");
        medicine.setLastTakenAt(now.minus(2, ChronoUnit.HOURS));
        medicine.setCreatedAt(now.minus(3, ChronoUnit.DAYS));
        medicineRepository.save(medicine);

        BloodReport blood = new BloodReport();
        blood.setUserId(userId);
        blood.setSummary("Demo report: one marker sat outside a general adult window.");
        blood.setFlaggedJson("""
                [{"name":"glucose","value":"7.2 mmol/L","status":"high","note":"Outside a general fasting window. This is not a diagnosis."}]
                """);
        blood.setRecommendationsJson("""
                ["Share this printout with a clinician. Do not change prescribed treatment from this app."]
                """);
        blood.setSource("DEMO");
        blood.setCreatedAt(now.minus(1, ChronoUnit.DAYS));
        bloodReportRepository.save(blood);

        WaterCheck water = new WaterCheck();
        water.setUserId(userId);
        water.setPh(7.2);
        water.setTds(120.0);
        water.setChlorine(0.4);
        water.setVerdict("safe");
        water.setTriggeredBy(null);
        water.setExplanation("Demo check using typical municipal-range readings. Not a guarantee for a specific person.");
        water.setSource("DEMO");
        water.setCreatedAt(now.minus(4, ChronoUnit.HOURS));
        waterCheckRepository.save(water);

        ChatMessage userMsg = new ChatMessage();
        userMsg.setUserId(userId);
        userMsg.setRole("USER");
        userMsg.setContent("Based on everything I added, what should I pay attention to today?");
        userMsg.setSource("USER");
        userMsg.setCreatedAt(now.minus(30, ChronoUnit.MINUTES));
        chatMessageRepository.save(userMsg);

        ChatMessage assistant = new ChatMessage();
        assistant.setUserId(userId);
        assistant.setRole("ASSISTANT");
        assistant.setContent(
                "Demo reply: notice the glucose flag on the sample blood report, keep logging Paracetamol only as your clinician directed, and treat the water check as general information. Book time with a doctor or pharmacist for anything that worries you."
        );
        assistant.setSource("DEMO");
        assistant.setCreatedAt(now.minus(29, ChronoUnit.MINUTES));
        chatMessageRepository.save(assistant);

        log.info("Seeded demo dashboard data for user {}", userId);
    }
}
