package org.example.Broomate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration
public class MultipartConfig {

    @Bean
    public MappingJackson2HttpMessageConverter multipartJacksonConverter() {
        return new MappingJackson2HttpMessageConverter();
    }
}