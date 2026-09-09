package com.healthos.healthos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    private String dose;

    private String frequency;

    @Column(name = "water_intake_note", columnDefinition = "TEXT")
    private String waterIntakeNote;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private String source;

    @Column(name = "last_taken_at")
    private Instant lastTakenAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
