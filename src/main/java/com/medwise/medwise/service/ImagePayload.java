package com.medwise.medwise.service;

import org.springframework.web.multipart.MultipartFile;

public final class ImagePayload {

    private ImagePayload() {
    }

    public static byte[] bytes(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }
        try {
            return image.getBytes();
        } catch (Exception ex) {
            return null;
        }
    }

    public static String mimeType(MultipartFile image) {
        if (image == null || image.getContentType() == null || image.getContentType().isBlank()) {
            return "image/jpeg";
        }
        return image.getContentType();
    }
}
