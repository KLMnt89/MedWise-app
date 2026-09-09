package com.healthos.healthos.dto;

import java.util.List;

public record DashboardResponse(
        int healthScore,
        String healthScoreNote,
        List<MedicineResponse> todaysMedicines,
        BloodScanResponse latestBlood,
        WaterCheckResponse latestWater,
        String disclaimer
) {
}
