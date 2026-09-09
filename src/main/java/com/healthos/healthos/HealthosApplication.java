package com.healthos.healthos;

import com.healthos.healthos.config.ExaProperties;
import com.healthos.healthos.config.GeminiProperties;
import com.healthos.healthos.config.HealthosProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({GeminiProperties.class, HealthosProperties.class, ExaProperties.class})
public class HealthosApplication {

    public static void main(String[] args) {
        SpringApplication.run(HealthosApplication.class, args);
    }

}
