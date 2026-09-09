package com.healthos.healthos.controller;

import com.healthos.healthos.dto.ChatMessageResponse;
import com.healthos.healthos.dto.ChatRequest;
import com.healthos.healthos.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatMessageResponse chat(@Valid @RequestBody ChatRequest request) {
        return chatService.chat(request.message());
    }

    @GetMapping({"", "/history"})
    public List<ChatMessageResponse> history() {
        return chatService.history();
    }
}
