package com.healthos.healthos.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GeminiServiceTest {

    @Test
    void stripFencesRemovesMarkdown() {
        String raw = """
                ```json
                {"reply":"hello"}
                ```
                """;
        assertEquals("{\"reply\":\"hello\"}", GeminiService.stripFences(raw));
    }
}
