package com.medwise.medwise;

import com.medwise.medwise.config.GeminiProperties;
import com.medwise.medwise.config.MedwiseProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({GeminiProperties.class, MedwiseProperties.class})
public class MedwiseApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedwiseApplication.class, args);
    }

}
