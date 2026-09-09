package com.healthos.healthos.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Hosts often provide {@code DATABASE_URL} as {@code postgres://user:pass@host:port/db}
 * or as {@code jdbc:postgresql://...}. Spring needs a JDBC URL and the Postgres driver.
 * If the variable is missing, leave the default H2 datasource in place.
 */
public class ProdDataSourceEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = firstRealUrl(
                environment.getProperty("DATABASE_URL"),
                environment.getProperty("SPRING_DATASOURCE_URL")
        );
        if (databaseUrl == null) {
            return;
        }

        Map<String, Object> mapped = new HashMap<>();
        mapped.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
        mapped.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

        if (databaseUrl.startsWith("jdbc:")) {
            mapped.put("spring.datasource.url", databaseUrl);
        } else {
            try {
                URI uri = URI.create(databaseUrl);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    int split = userInfo.indexOf(':');
                    mapped.put("spring.datasource.username", userInfo.substring(0, split));
                    mapped.put("spring.datasource.password", userInfo.substring(split + 1));
                } else if (userInfo != null) {
                    mapped.put("spring.datasource.username", userInfo);
                }
                String path = uri.getPath() == null ? "" : uri.getPath();
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String jdbc = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + path;
                if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                    jdbc += "?" + uri.getQuery();
                }
                mapped.put("spring.datasource.url", jdbc);
            } catch (Exception ignored) {
                return;
            }
        }
        environment.getPropertySources().addFirst(new MapPropertySource("mappedDatabaseUrl", mapped));
    }

    private static String firstRealUrl(String... candidates) {
        for (String value : candidates) {
            if (value == null || value.isBlank()) {
                continue;
            }
            if (value.contains("${") || value.equals("null")) {
                continue;
            }
            if (value.startsWith("postgres://") || value.startsWith("postgresql://") || value.startsWith("jdbc:")) {
                return value;
            }
        }
        return null;
    }
}
