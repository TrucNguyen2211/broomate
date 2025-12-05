package org.example.Broomate.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Getter
@Configuration
public class SupabaseConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.api-key}")
    private String apiKey;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    @Value("${supabase.bucket}")
    private String bucket;

    /**
     * Get public URL (only works if bucket has public access)
     */
    public String getPublicUrl(String filePath) {
        return String.format("%s/storage/v1/object/public/%s/%s",
                supabaseUrl, bucket, filePath);
    }

    /**
     * Generate signed URL with expiration (works with private buckets)
     * @param filePath - path to file in bucket
     * @param expiresInSeconds - how long the URL is valid (default: 1 year)
     */
    public String getSignedUrl(String filePath, long expiresInSeconds) {
        try {
            long expiresAt = Instant.now().getEpochSecond() + expiresInSeconds;

            String url = String.format("%s/storage/v1/object/sign/%s/%s?expiresIn=%d",
                    supabaseUrl, bucket, filePath, expiresInSeconds);

            return url;
        } catch (Exception e) {
            log.error("Error generating signed URL", e);
            return getPublicUrl(filePath);
        }
    }

}