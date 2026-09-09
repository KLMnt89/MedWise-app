package com.healthos.healthos;

import com.healthos.healthos.service.ExaService;
import com.healthos.healthos.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExaService exaService;

    @MockitoBean
    private GeminiService geminiService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void healthIsOk() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.exaConfigured").value(false));
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void catalogListsFeatureEndpoints() throws Exception {
        mockMvc.perform(get("/api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpoints").isArray())
                .andExpect(jsonPath("$.disclaimer").exists());
    }

    @Test
    void medicineScanFallsBackWhenExaIsEmpty() throws Exception {
        when(exaService.generateJson(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(multipart("/api/medicine/scan").param("name", "paracetamol"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fallback").value(true))
                .andExpect(jsonPath("$.name").value("paracetamol"))
                .andExpect(jsonPath("$.disclaimer").exists());
    }

    @Test
    void medicineListAndTakenWork() throws Exception {
        when(exaService.generateJson(anyString())).thenReturn(Optional.empty());

        MvcResult created = mockMvc.perform(multipart("/api/medicine/scan").param("name", "ibuprofen"))
                .andExpect(status().isOk())
                .andReturn();
        String id = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id").toString();

        mockMvc.perform(post("/api/medicine/" + id + "/taken"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastTakenAt").exists());

        mockMvc.perform(get("/api/medicine"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void bloodScanFallsBackAndLists() throws Exception {
        when(exaService.generateJson(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(multipart("/api/blood/scan").param("values", "{\"glucose\": 7.2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fallback").value(true))
                .andExpect(jsonPath("$.flaggedValues").isArray())
                .andExpect(jsonPath("$.disclaimer").exists());

        mockMvc.perform(get("/api/blood"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void waterCheckUsesLocalRulesWhenExaFails() throws Exception {
        when(exaService.generateJson(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/water/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ph\":7.2,\"tds\":120,\"chlorine\":0.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verdict").value("safe"))
                .andExpect(jsonPath("$.fallback").value(true));

        mockMvc.perform(get("/api/water"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void waterCheckAcceptsStripPhotoWithoutReadings() throws Exception {
        mockMvc.perform(multipart("/api/water/check")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "image", "strip.jpg", "image/jpeg", new byte[] {1, 2, 3})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fallback").value(true))
                .andExpect(jsonPath("$.verdict").value("caution"));
    }

    @Test
    void waterPhotoUsesVisionAiOpinion() throws Exception {
        when(geminiService.generateJson(anyString(), any(), any())).thenReturn(
                Optional.of(objectMapper.readTree(
                        "{\"verdict\":\"caution\",\"triggeredBy\":\"cloudiness\",\"explanation\":\"Looks cloudy; treat this as a visual impression only.\"}"
                ))
        );
        mockMvc.perform(multipart("/api/water/check")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "image", "water.jpg", "image/jpeg", new byte[] {1, 2, 3})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("GEMINI"))
                .andExpect(jsonPath("$.fallback").value(false))
                .andExpect(jsonPath("$.explanation").value("Looks cloudy; treat this as a visual impression only."));
    }

    @Test
    void waterRejectsOutOfRangePh() throws Exception {
        mockMvc.perform(post("/api/water/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ph\":99,\"tds\":120,\"chlorine\":0.5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_error"));
    }

    @Test
    void chatPostUsesExaAndGetReturnsHistory() throws Exception {
        when(exaService.chatReply(anyString())).thenReturn("Review today's log with a clinician if anything looks off.");

        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"What should I pay attention to today?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value("EXA"))
                .andExpect(jsonPath("$.fallback").value(false))
                .andExpect(jsonPath("$.role").value("ASSISTANT"));

        mockMvc.perform(get("/api/chat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThanOrEqualTo(2))));
    }

    @Test
    void chatRejectsBlankMessage() throws Exception {
        mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dashboardReturnsScore() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore").exists())
                .andExpect(jsonPath("$.disclaimer").exists());
    }

    @Test
    void unknownPathIsNotFound() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("not_found"));
    }
}
