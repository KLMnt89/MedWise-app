package com.medwise.medwise.repository;

import com.medwise.medwise.entity.WaterCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface WaterCheckRepository extends JpaRepository<WaterCheck, Long> {

    List<WaterCheck> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<WaterCheck> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(Long userId, Instant from);
}
