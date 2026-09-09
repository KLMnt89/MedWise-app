package com.medwise.medwise.controller;

import com.medwise.medwise.dto.MedicineResponse;
import com.medwise.medwise.service.MedicineService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/medicine")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @PostMapping("/scan")
    public MedicineResponse scan(
            @RequestParam(value = "name", required = false) String name,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return medicineService.scan(name, image);
    }

    @PostMapping("/{id}/taken")
    public MedicineResponse taken(@PathVariable Long id) {
        return medicineService.markTaken(id);
    }

    @GetMapping
    public List<MedicineResponse> list() {
        return medicineService.list();
    }
}
