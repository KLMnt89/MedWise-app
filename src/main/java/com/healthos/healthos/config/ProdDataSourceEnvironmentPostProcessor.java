package com.healthos.healthos.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Railway and similar hosts provide {@code DATABASE_URL} as {@code postgres://user:pass@host:port/db}.
 * Spring needs a JDBC URL; this maps it when the prod profile is active.
 */
public class ProdDataSourceEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean prod = false;
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equals(profile)) {
                prod = true;
                break;
            }
        }
        if (!prod) {
            return;
        }
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }
        if (databaseUrl.startsWith("jdbc:")) {
            return;
        }
        try {
            URI uri = URI.create(databaseUrl);
            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null && userInfo.contains(":")) {
                int split = userInfo.indexOf(':');
                username = userInfo.substring(0, split);
                password = userInfo.substring(split + 1);
            } else {
                username = userInfo;
            }
            String path = uri.getPath() == null ? "" : uri.getPath();
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String jdbc = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + path;
            Map<String, Object> mapped = new HashMap<>();
            mapped.put("spring.datasource.url", jdbc);
            if (username != null) {
                mapped.put("spring.datasource.username", username);
            }
            if (password != null) {
                mapped.put("spring.datasource.password", password);
            }
            environment.getPropertySources().addFirst(new MapPropertySource("railwayDatabaseUrl", mapped));
        } catch (Exception ignored) {
            // Leave configured datasource properties as-is if the URL cannot be parsed.
        }
    }
}
