package com.healthos.healthos.repository;

import com.healthos.healthos.entity.BloodReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface BloodReportRepository extends JpaRepository<BloodReport, Long> {

    List<BloodReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<BloodReport> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(Long userId, Instant from);
}
