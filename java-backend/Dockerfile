## For Production
#FROM maven:3.9-amazoncorretto-21-al2023 AS builder
#WORKDIR /app
#COPY pom.xml .
## Download dependencies separately (better caching)
#RUN mvn dependency:go-offline
#
#COPY src ./src
#RUN mvn package -DskipTests
#
#FROM amazoncorretto:21-alpine
#WORKDIR /app
#COPY --from=builder /app/target/*.jar app.jar
#EXPOSE 8080
#CMD ["java", "-jar", "app.jar"]

# For Development
FROM maven:3.9-amazoncorretto-21-al2023
WORKDIR /app

# Copy pom.xml for dependency resolution
COPY pom.xml .
RUN mvn dependency:go-offline -B -DskipTests

# Copy source code
COPY src ./src

# mount the source code as a volume
EXPOSE 8080

# Using spring-boot-devtools for hot reloading
CMD ["mvn", "spring-boot:run"]
