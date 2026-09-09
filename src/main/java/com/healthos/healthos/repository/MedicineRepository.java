package com.healthos.healthos.repository;

import com.healthos.healthos.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Medicine> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(Long userId, Instant from);

    List<Medicine> findByUserIdAndLastTakenAtGreaterThanEqual(Long userId, Instant from);
}
