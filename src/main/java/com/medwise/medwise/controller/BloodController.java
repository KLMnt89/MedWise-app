package com.medwise.medwise.controller;

import com.medwise.medwise.dto.BloodScanResponse;
import com.medwise.medwise.service.BloodService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/blood")
public class BloodController {

    private final BloodService bloodService;

    public BloodController(BloodService bloodService) {
        this.bloodService = bloodService;
    }

    @PostMapping("/scan")
    public BloodScanResponse scan(
            @RequestParam(value = "values", required = false) String values,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return bloodService.scan(values, image);
    }

    @GetMapping
    public List<BloodScanResponse> list() {
        return bloodService.list();
    }
}
