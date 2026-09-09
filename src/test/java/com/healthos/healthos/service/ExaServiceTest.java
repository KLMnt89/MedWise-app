package com.healthos.healthos.service;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ExaServiceTest {

    @Test
    void formatResultsIncludesTitleAndUrl() {
        var mapper = JsonMapper.builder().build();
        var root = mapper.readTree("""
                {
                  "results": [
                    {
                      "title": "WHO drinking-water",
                      "url": "https://www.who.int/example",
                      "highlights": ["Safe drinking-water is a public health priority."]
                    }
                  ]
                }
                """);
        String formatted = ExaService.formatResults(root);
        assertTrue(formatted.contains("WHO drinking-water"));
        assertTrue(formatted.contains("https://www.who.int/example"));
        assertTrue(formatted.contains("Safe drinking-water"));
    }

    @Test
    void parseJsonFromAnswerReadsObject() {
        var mapper = JsonMapper.builder().build();
        var node = ExaService.parseJsonFromAnswer(mapper, "here {\"verdict\":\"safe\"} extra").orElseThrow();
        assertTrue(node.path("verdict").asText().equals("safe"));
    }
}
