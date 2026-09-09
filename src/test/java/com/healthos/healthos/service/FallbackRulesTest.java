package com.healthos.healthos.service;

import com.healthos.healthos.dto.FlaggedValue;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FallbackRulesTest {

    private final FallbackRules rules = new FallbackRules();

    @Test
    void knownMedicineIsLookedUp() {
        FallbackRules.MedicineFallback result = rules.medicine("Ibuprofen 200mg");
        assertTrue(result.purpose().toLowerCase().contains("pain"));
        assertTrue(result.explanation().contains("AI unavailable"));
    }

    @Test
    void unknownMedicineDoesNotInventADose() {
        FallbackRules.MedicineFallback result = rules.medicine("Zorvexilon");
        assertTrue(result.dose().toLowerCase().contains("do not guess"));
    }

    @Test
    void highGlucoseIsFlagged() {
        FallbackRules.BloodFallback result = rules.blood(Map.of("glucose", 8.1));
        assertFalse(result.flaggedValues().isEmpty());
        FlaggedValue flagged = result.flaggedValues().getFirst();
        assertEquals("high", flagged.status());
    }

    @Test
    void waterCautionWhenPhIsLow() {
        FallbackRules.WaterFallback result = rules.water(5.0, 120, 0.5);
        assertEquals("caution", result.verdict());
        assertTrue(result.triggeredBy().contains("pH"));
    }

    @Test
    void waterSafeInGeneralWindow() {
        FallbackRules.WaterFallback result = rules.water(7.2, 120, 0.5);
        assertEquals("safe", result.verdict());
    }

    @Test
    void waterFromPhotoAsksForManualReadings() {
        FallbackRules.WaterFallback result = rules.waterFromPhoto();
        assertEquals("caution", result.verdict());
        assertTrue(result.explanation().toLowerCase().contains("photo"));
    }
}
