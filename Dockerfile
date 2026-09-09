FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY src src
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/medwise-0.0.1-SNAPSHOT.jar app.jar
# Default is file H2 (starting page). Set SPRING_PROFILES_ACTIVE=prod and DATABASE_URL for Postgres.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
