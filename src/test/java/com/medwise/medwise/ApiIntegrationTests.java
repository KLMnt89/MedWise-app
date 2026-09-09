package com.medwise.medwise;

import com.medwise.medwise.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

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
    private GeminiService geminiService;

    @Test
    void healthIsOk() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void medicineScanFallsBackWhenGeminiIsEmpty() throws Exception {
        when(geminiService.generateJson(anyString(), any(), any())).thenReturn(Optional.empty());

        mockMvc.perform(multipart("/api/medicine/scan").param("name", "paracetamol"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fallback").value(true))
                .andExpect(jsonPath("$.name").value("paracetamol"))
                .andExpect(jsonPath("$.disclaimer").exists());
    }

    @Test
    void waterCheckUsesLocalRulesWhenGeminiFails() throws Exception {
        when(geminiService.generateJson(anyString(), any(), any())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/water/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ph\":7.2,\"tds\":120,\"chlorine\":0.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verdict").value("safe"))
                .andExpect(jsonPath("$.fallback").value(true));
    }

    @Test
    void dashboardReturnsScore() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.healthScore").exists());
    }
}
