package org.example.Broomate.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY = "your-secret-key-change-this-in-production-must-be-at-least-256-bits-long";
    private static final String ISSUER = "broomate-app";
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(SECRET_KEY);
    }

    public String extractEmail(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getSubject();
        } catch (JWTVerificationException exception) {
            throw new RuntimeException("Failed to extract email from token", exception);
        }
    }

    // ✅ Add this method
    public String extractUserId(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getClaim("userId").asString();
        } catch (JWTVerificationException exception) {
            throw new RuntimeException("Failed to extract userId from token", exception);
        }
    }

    // ✅ Add this method
    public String extractRole(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getClaim("role").asString();
        } catch (JWTVerificationException exception) {
            throw new RuntimeException("Failed to extract role from token", exception);
        }
    }

    public Date extractExpiration(String token) {
        try {
            DecodedJWT decodedJWT = JWT.decode(token);
            return decodedJWT.getExpiresAt();
        } catch (JWTVerificationException exception) {
            throw new RuntimeException("Failed to extract expiration from token", exception);
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ✅ Update to accept email, userId, role
    public String generateToken(String email, String userId, String role) {
        try {
            Algorithm algorithm = getAlgorithm();
            return JWT.create()
                    .withSubject(email)
                    .withClaim("userId", userId)      // ✅ Add userId
                    .withClaim("role", role)          // ✅ Add role
                    .withIssuer(ISSUER)
                    .withIssuedAt(new Date(System.currentTimeMillis()))
                    .withExpiresAt(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Failed to create JWT token", exception);
        }
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            Algorithm algorithm = getAlgorithm();
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build();

            DecodedJWT decodedJWT = verifier.verify(token);
            String email = decodedJWT.getSubject();

            return (email.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (JWTVerificationException exception) {
            return false;
        }
    }
}