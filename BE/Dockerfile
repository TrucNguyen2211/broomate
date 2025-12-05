FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
# Copy wrapper script and folder explicitly so gradlew exists in the image.
COPY gradlew ./gradlew
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY src ./src
# Normalize line endings (for Windows checkouts), make executable, build jar without tests.
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew bootJar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*SNAPSHOT.jar app.jar
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","echo \"$FIREBASE_SERVICE_ACCOUNT_JSON\" > /app/firebase.json && java $JAVA_OPTS -Dfirebase.credentials.path=/app/firebase.json -jar app.jar"]
