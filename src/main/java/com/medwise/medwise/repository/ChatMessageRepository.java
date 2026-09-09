package com.medwise.medwise.repository;

import com.medwise.medwise.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByUserIdOrderByCreatedAtAsc(Long userId);

    List<ChatMessage> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(Long userId, Instant from);
}
