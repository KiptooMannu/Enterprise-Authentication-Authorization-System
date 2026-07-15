package com.authcore.authcore.security;

import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.repository.UserRepository;
import com.authcore.authcore.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    @NonNull private final String frontendUrl;
    @NonNull private final String oauth2CallbackPath;

    public OAuth2LoginSuccessHandler(JwtService jwtService,
                                     RefreshTokenService refreshTokenService,
                                     UserRepository userRepository,
                                     @NonNull @Value("${FRONTEND_URL:http://localhost:5173}") String frontendUrl,
                                     @NonNull @Value("${FRONTEND_OAUTH2_CALLBACK_PATH:/oauth2/callback}") String oauth2CallbackPath) {
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.frontendUrl = Objects.requireNonNull(frontendUrl, "frontendUrl must not be null");
        this.oauth2CallbackPath = Objects.requireNonNull(oauth2CallbackPath, "oauth2CallbackPath must not be null");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            String provider = oauthToken.getAuthorizedClientRegistrationId();
            OAuth2User oauthUser = oauthToken.getPrincipal();
            Map<String, Object> attributes = oauthUser.getAttributes();

            Object emailObj = attributes.get("email");
            String email = emailObj != null ? emailObj.toString() : null;
            Object nameObj = attributes.get("name");
            String username = nameObj != null ? nameObj.toString() : null;
            String providerId = oauthUser.getName(); // Unique provider user ID

            if (email == null) {
                // For GitHub, email might be in a different attribute or null, use providerId or login name
                Object loginObj = attributes.get("login");
                String login = loginObj != null ? loginObj.toString() : null;
                email = login != null ? login + "@github.com" : providerId + "@github.com";
            }

            if (username == null) {
                Object loginObj = attributes.get("login");
                username = loginObj != null ? loginObj.toString() : null;
                if (username == null) {
                    username = email != null ? email.split("@")[0] : providerId;
                }
            }

            // Find or create user
            Optional<UserEntity> userOpt = userRepository.findByEmail(email);
            UserEntity user;
            if (userOpt.isPresent()) {
                user = userOpt.get();
                // Link account if not already linked
                if (user.getOauthProvider() == null) {
                    user.setOauthProvider(provider);
                    user.setOauthProviderId(providerId);
                    user = userRepository.save(user);
                }
            } else {
                user = new UserEntity(username, email, null);
                user.setOauthProvider(provider);
                user.setOauthProviderId(providerId);
                user.setRole(UserRole.USER);
                user.setEnabled(true);
                user = userRepository.save(user);
            }

            // Generate tokens
            String accessToken = jwtService.generateToken(user.getEmail());
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            var refresh = refreshTokenService.createRefreshToken(user, ipAddress, userAgent);

            // Redirect back to React frontend
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path(oauth2CallbackPath)
                    .queryParam("token", accessToken)
                    .queryParam("refreshToken", refresh.getToken())
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } else {
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String[] ips = xForwardedFor.split(",");
            if (ips.length > 0) {
                String trimmedIp = ips[0].trim();
                if (!trimmedIp.isEmpty()) {
                    return trimmedIp;
                }
            }
        }
        return request.getRemoteAddr();
    }
}
