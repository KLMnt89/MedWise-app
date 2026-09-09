package com.healthos.healthos.controller;

import com.healthos.healthos.dto.WaterCheckRequest;
import com.healthos.healthos.dto.WaterCheckResponse;
import com.healthos.healthos.service.WaterService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/water")
public class WaterController {

    private final WaterService waterService;

    public WaterController(WaterService waterService) {
        this.waterService = waterService;
    }

    @PostMapping(value = "/check", consumes = MediaType.APPLICATION_JSON_VALUE)
    public WaterCheckResponse checkJson(@Valid @RequestBody WaterCheckRequest request) {
        return waterService.check(request.ph(), request.tds(), request.chlorine(), null);
    }

    @PostMapping(value = "/check", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public WaterCheckResponse checkForm(
            @RequestParam(value = "ph", required = false) Double ph,
            @RequestParam(value = "tds", required = false) Double tds,
            @RequestParam(value = "chlorine", required = false) Double chlorine,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return waterService.check(ph, tds, chlorine, image);
    }

    @GetMapping
    public List<WaterCheckResponse> list() {
        return waterService.list();
    }
}
