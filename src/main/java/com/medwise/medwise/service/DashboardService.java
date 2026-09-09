package com.medwise.medwise.service;

import com.medwise.medwise.config.MedwiseProperties;
import com.medwise.medwise.dto.BloodScanResponse;
import com.medwise.medwise.dto.DashboardResponse;
import com.medwise.medwise.dto.MedicineResponse;
import com.medwise.medwise.dto.WaterCheckResponse;
import com.medwise.medwise.entity.BloodReport;
import com.medwise.medwise.entity.Medicine;
import com.medwise.medwise.entity.WaterCheck;
import com.medwise.medwise.repository.BloodReportRepository;
import com.medwise.medwise.repository.MedicineRepository;
import com.medwise.medwise.repository.WaterCheckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DashboardService {

    private final MedicineRepository medicineRepository;
    private final BloodReportRepository bloodReportRepository;
    private final WaterCheckRepository waterCheckRepository;
    private final MedicineService medicineService;
    private final BloodService bloodService;
    private final WaterService waterService;
    private final CurrentUserService currentUserService;
    private final MedwiseProperties properties;

    public DashboardService(
            MedicineRepository medicineRepository,
            BloodReportRepository bloodReportRepository,
            WaterCheckRepository waterCheckRepository,
            MedicineService medicineService,
            BloodService bloodService,
            WaterService waterService,
            CurrentUserService currentUserService,
            MedwiseProperties properties
    ) {
        this.medicineRepository = medicineRepository;
        this.bloodReportRepository = bloodReportRepository;
        this.waterCheckRepository = waterCheckRepository;
        this.medicineService = medicineService;
        this.bloodService = bloodService;
        this.waterService = waterService;
        this.currentUserService = currentUserService;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        Long userId = currentUserService.id();
        Instant startOfDay = Instant.now().minus(24, ChronoUnit.HOURS);
        Instant thirtyDays = Instant.now().minus(30, ChronoUnit.DAYS);

        List<Medicine> todays = medicineRepository.findByUserIdAndLastTakenAtGreaterThanEqual(userId, startOfDay);
        List<MedicineResponse> todayResponses = todays.stream().map(medicineService::toResponse).toList();

        BloodReport latestBlood = bloodReportRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().findFirst().orElse(null);
        WaterCheck latestWater = waterCheckRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().findFirst().orElse(null);

        boolean recentFlags = bloodReportRepository.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(userId, thirtyDays)
                .stream()
                .anyMatch(report -> {
                    String json = report.getFlaggedJson();
                    return json != null && (json.contains("\"high\"") || json.contains("\"low\""));
                });

        int score = 80;
        StringBuilder note = new StringBuilder("This score is a simple reminder, not a clinical rating. ");
        if (recentFlags) {
            score -= 15;
            note.append("A recent blood marker sat outside a general window. ");
        }
        if (latestWater != null && "caution".equalsIgnoreCase(latestWater.getVerdict())) {
            score -= 10;
            note.append("The latest water check was caution. ");
        }
        if (!todays.isEmpty()) {
            score += 5;
            note.append("You logged medicine as taken in the last 24 hours. ");
        }
        score = Math.max(0, Math.min(100, score));

        BloodScanResponse bloodResponse = latestBlood == null ? null : bloodService.toResponse(latestBlood);
        WaterCheckResponse waterResponse = latestWater == null ? null : waterService.toResponse(latestWater);
        return new DashboardResponse(
                score,
                note.toString().trim(),
                todayResponses,
                bloodResponse,
                waterResponse,
                properties.disclaimer()
        );
    }
}
