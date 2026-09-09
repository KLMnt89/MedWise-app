package com.healthos.healthos.service;

import com.healthos.healthos.config.HealthosProperties;
import com.healthos.healthos.entity.AppUser;
import com.healthos.healthos.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;
    private final HealthosProperties properties;

    public CurrentUserService(UserRepository userRepository, HealthosProperties properties) {
        this.userRepository = userRepository;
        this.properties = properties;
    }

    public Long id() {
        Long configured = properties.defaultUserId();
        if (configured != null) {
            return userRepository.findById(configured)
                    .map(AppUser::getId)
                    .orElseGet(this::firstUserId);
        }
        return firstUserId();
    }

    private Long firstUserId() {
        return userRepository.findAll().stream()
                .findFirst()
                .map(AppUser::getId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No default user"));
    }
}
