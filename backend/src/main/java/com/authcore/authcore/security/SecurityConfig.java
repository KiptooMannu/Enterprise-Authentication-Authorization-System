package com.authcore.authcore.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService, com.authcore.authcore.service.TokenBlacklistService tokenBlacklistService) {
        return new JwtAuthenticationFilter(jwtService, userDetailsService, tokenBlacklistService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter, Environment env) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource(env)))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/users/register", "/api/users/login", "/api/auth/refresh", "/api/auth/logout", "/api/auth/revoke").permitAll()
                .requestMatchers("/api/auth/verify-email", "/api/auth/resend-verification").permitAll()
                .requestMatchers("/api/users/forgot-password", "/api/users/reset-password").permitAll()
                .requestMatchers("/login/oauth2/**", "/oauth2/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/protected/admin").hasRole("ADMIN")
                .requestMatchers("/api/protected/manager").hasAnyRole("MANAGER", "ADMIN")
                .anyRequest().authenticated())
            .sessionManagement(sm -> sm.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED))
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Access denied\"}");
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(Environment env) {
        Objects.requireNonNull(env, "Environment must not be null");
        CorsConfiguration configuration = createCorsConfiguration(env);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration(Environment env) {
        Objects.requireNonNull(env, "Environment must not be null");
        CorsConfiguration configuration = createCorsConfiguration(env);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        CorsFilter corsFilter = new CorsFilter(source);
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(corsFilter);
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private static final List<String> DEFAULT_ALLOWED_ORIGINS =
        List.of("http://localhost:5173", "http://localhost:3000");

    @NonNull
    private CorsConfiguration createCorsConfiguration(Environment env) {
        Objects.requireNonNull(env, "Environment must not be null");
        CorsConfiguration configuration = new CorsConfiguration();

        String allowedOrigins = env.getProperty("FRONTEND_ALLOWED_ORIGINS");
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            allowedOrigins = env.getProperty("FRONTEND_URL");
        }

        List<String> origins;
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            log.warn("No FRONTEND_ALLOWED_ORIGINS/FRONTEND_URL configured; "
                + "falling back to development defaults {}. Set FRONTEND_ALLOWED_ORIGINS explicitly in production.",
                DEFAULT_ALLOWED_ORIGINS);
            origins = DEFAULT_ALLOWED_ORIGINS;
        } else {
            origins = Arrays.stream(allowedOrigins.split("\\s*,\\s*"))
                .filter(o -> !o.isBlank())
                .toList();
        }

        // Never combine a wildcard origin with credentials: it would let any site make
        // authenticated cross-origin requests. Reject the wildcard instead.
        if (origins.contains("*")) {
            throw new IllegalStateException(
                "Wildcard '*' origin is not permitted with credentialed CORS. "
                + "Configure explicit origins via FRONTEND_ALLOWED_ORIGINS.");
        }

        configuration.setAllowedOriginPatterns(origins);
        configuration.addAllowedMethod(CorsConfiguration.ALL);
        configuration.addAllowedHeader(CorsConfiguration.ALL);
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));
        return configuration;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
