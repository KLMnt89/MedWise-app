package com.medwise.medwise.controller;

import com.medwise.medwise.dto.WaterCheckRequest;
import com.medwise.medwise.dto.WaterCheckResponse;
import com.medwise.medwise.service.WaterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/water")
public class WaterController {

    private final WaterService waterService;

    public WaterController(WaterService waterService) {
        this.waterService = waterService;
    }

    @PostMapping("/check")
    public WaterCheckResponse check(@Valid @RequestBody WaterCheckRequest request) {
        return waterService.check(request);
    }

    @GetMapping
    public List<WaterCheckResponse> list() {
        return waterService.list();
    }
}
