package com.healthos.healthos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class HttpClientConfig {

    @Bean
    public RestClient geminiRestClient() {
        return RestClient.builder()
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    public RestClient exaRestClient() {
        return RestClient.builder()
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    @Bean
    @Primary
    public JsonMapper jsonMapper() {
        return JsonMapper.builder().build();
    }
}

