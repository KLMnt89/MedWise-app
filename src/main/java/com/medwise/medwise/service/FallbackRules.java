package com.medwise.medwise.service;

import com.medwise.medwise.dto.FlaggedValue;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class FallbackRules {

    public record MedicineFallback(
            String name,
            String purpose,
            String dose,
            String frequency,
            String waterIntakeNote,
            String explanation
    ) {
    }

    public record WaterFallback(String verdict, String triggeredBy, String explanation) {
    }

    public record BloodFallback(String summary, List<FlaggedValue> flaggedValues, List<String> recommendations) {
    }

    private static final Map<String, MedicineFallback> KNOWN_MEDICINES = new LinkedHashMap<>();

    static {
        putMedicine("paracetamol", "Pain and fever relief (general information)",
                "Follow the pack or your pharmacist", "As labelled",
                "Take with a glass of water unless a clinician has advised otherwise.");
        putMedicine("acetaminophen", "Pain and fever relief (general information)",
                "Follow the pack or your pharmacist", "As labelled",
                "Take with a glass of water unless a clinician has advised otherwise.");
        putMedicine("ibuprofen", "Pain and inflammation relief (general information)",
                "Follow the pack or your pharmacist", "As labelled",
                "Often taken with food and water; ask a pharmacist if you have stomach issues.");
        putMedicine("aspirin", "Used in some pain and heart-related regimens (general information)",
                "Only as prescribed or labelled", "As labelled",
                "Take with water; do not start or stop heart-related aspirin without a clinician.");
        putMedicine("metformin", "Used in type 2 diabetes care (general information)",
                "Only as prescribed", "As prescribed",
                "Usually taken with meals and water. Do not change the dose on your own.");
        putMedicine("amoxicillin", "An antibiotic used for some bacterial infections (general information)",
                "Only as prescribed", "As prescribed",
                "Complete the course your clinician prescribed; take with water.");
        putMedicine("omeprazole", "Used to reduce stomach acid (general information)",
                "Only as labelled or prescribed", "As labelled",
                "Often taken before a meal with water.");
        putMedicine("atorvastatin", "Used to lower cholesterol as part of a clinician-led plan",
                "Only as prescribed", "As prescribed",
                "Typically taken with water; timing is set by the prescriber.");
        putMedicine("loratadine", "Used for allergy symptoms (general information)",
                "Follow the pack or your pharmacist", "As labelled",
                "Take with water unless the pack says otherwise.");
        putMedicine("vitamin d", "A vitamin supplement (general information)",
                "Follow the pack or your clinician", "As labelled",
                "Often taken with a meal that contains some fat, plus water.");
    }

    private static void putMedicine(String key, String purpose, String dose, String frequency, String water) {
        KNOWN_MEDICINES.put(key, new MedicineFallback(
                capitalize(key),
                purpose,
                dose,
                frequency,
                water,
                "AI unavailable, showing basic analysis from a small known-medicine table. This is not a prescription check."
        ));
    }

    public MedicineFallback medicine(String name) {
        String key = normalize(name);
        for (Map.Entry<String, MedicineFallback> entry : KNOWN_MEDICINES.entrySet()) {
            if (key.contains(entry.getKey()) || entry.getKey().contains(key)) {
                MedicineFallback known = entry.getValue();
                return new MedicineFallback(
                        name == null || name.isBlank() ? known.name() : name.trim(),
                        known.purpose(),
                        known.dose(),
                        known.frequency(),
                        known.waterIntakeNote(),
                        known.explanation()
                );
            }
        }
        String display = name == null || name.isBlank() ? "Unknown medicine" : name.trim();
        return new MedicineFallback(
                display,
                "Not in the local table. Ask a pharmacist what this medicine is for.",
                "Do not guess a dose — use the pack or a clinician",
                "Unknown",
                "If you take it, use water as the pack describes. This app cannot confirm it is right for you.",
                "AI unavailable, showing basic analysis. The name was not in the local lookup table."
        );
    }

    public BloodFallback blood(Map<String, Double> values) {
        List<FlaggedValue> flagged = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        if (values == null || values.isEmpty()) {
            return new BloodFallback(
                    "AI unavailable, showing basic analysis. No numeric values were provided.",
                    List.of(),
                    List.of("Retake a photo of a clear report, or enter values such as glucose, hemoglobin, or cholesterol.")
            );
        }
        values.forEach((rawName, value) -> {
            if (value == null) {
                return;
            }
            String name = rawName.toLowerCase(Locale.ROOT);
            Range range = rangeFor(name, value);
            if (range == null) {
                flagged.add(new FlaggedValue(rawName, String.valueOf(value), "unknown",
                        "No local reference range for this marker."));
                return;
            }
            String status = "normal";
            if (value < range.low()) {
                status = "low";
            } else if (value > range.high()) {
                status = "high";
            }
            if (!"normal".equals(status)) {
                flagged.add(new FlaggedValue(rawName, String.valueOf(value), status,
                        "Outside a general adult reference window (" + range.low() + "–" + range.high() + " "
                                + range.unit() + "). This is not a diagnosis."));
                recommendations.add("Ask a clinician to interpret " + rawName + " in context of the full report.");
            }
        });
        if (recommendations.isEmpty()) {
            recommendations.add("Entered values sit in a general reference window. A clinician should still review the full report.");
        }
        String summary = flagged.isEmpty()
                ? "AI unavailable, showing basic analysis. No values were outside the local reference table."
                : "AI unavailable, showing basic analysis. Some values were outside a general reference window.";
        return new BloodFallback(summary, flagged, recommendations);
    }

    public WaterFallback water(double ph, double tds, double chlorine) {
        List<String> issues = new ArrayList<>();
        if (ph < 6.5 || ph > 8.5) {
            issues.add("pH (" + ph + ")");
        }
        if (tds < 50 || tds > 500) {
            issues.add("TDS (" + tds + ")");
        }
        if (chlorine < 0.2 || chlorine > 4.0) {
            issues.add("chlorine (" + chlorine + ")");
        }
        if (issues.isEmpty()) {
            return new WaterFallback(
                    "safe",
                    null,
                    "AI unavailable, showing basic analysis. pH, TDS, and chlorine sit in a general drinking-water window. This does not prove the water is safe for you."
            );
        }
        return new WaterFallback(
                "caution",
                String.join(", ", issues),
                "AI unavailable, showing basic analysis. One or more readings sat outside a general window (pH 6.5–8.5, TDS 50–500, chlorine 0.2–4.0). This is not a lab certification."
        );
    }

    private record Range(double low, double high, String unit) {
    }

    private Range rangeFor(String name, double value) {
        if (name.contains("glucose") || name.contains("sugar")) {
            if (value > 20) {
                return new Range(70, 100, "mg/dL fasting (general)");
            }
            return new Range(3.9, 5.6, "mmol/L fasting (general)");
        }
        if (name.contains("hemoglobin") || name.equals("hb") || name.contains("hgb")) {
            return new Range(12, 17, "g/dL (general adult)");
        }
        if (name.contains("cholesterol")) {
            if (value > 20) {
                return new Range(0, 200, "mg/dL (general)");
            }
            return new Range(0, 5.2, "mmol/L (general)");
        }
        if (name.contains("creatinine")) {
            if (value < 2) {
                return new Range(0.6, 1.3, "mg/dL (general)");
            }
            return new Range(60, 110, "µmol/L (general)");
        }
        if (name.contains("tsh")) {
            return new Range(0.4, 4.0, "mIU/L (general)");
        }
        if (name.contains("vitamin d") || name.contains("25-oh") || name.contains("25oh")) {
            return new Range(50, 125, "nmol/L (general)");
        }
        return null;
    }

    private static String normalize(String name) {
        return name == null ? "" : name.toLowerCase(Locale.ROOT).trim();
    }

    private static String capitalize(String key) {
        if (key.isEmpty()) {
            return key;
        }
        return Character.toUpperCase(key.charAt(0)) + key.substring(1);
    }
}
