package com.authcore.authcore.config;

import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.entity.UserRole;
import com.authcore.authcore.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class InitialDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitialDataLoader.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminEmail;
    private final String adminPassword;

    public InitialDataLoader(UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             @Value("${ADMIN_BOOTSTRAP_USERNAME:admin}") String adminUsername,
                             @Value("${ADMIN_BOOTSTRAP_EMAIL:}") String adminEmail,
                             @Value("${ADMIN_BOOTSTRAP_PASSWORD:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            log.info("Skipping admin bootstrap: set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD "
                + "to seed an initial administrator account.");
            return;
        }

        userRepository.findByEmail(adminEmail).ifPresentOrElse(user -> {
            if (user.getRole() != UserRole.ADMIN) {
                user.setRole(UserRole.ADMIN);
                userRepository.save(user);
            }
        }, () -> {
            UserEntity admin = new UserEntity(adminUsername, adminEmail, passwordEncoder.encode(adminPassword));
            admin.setRole(UserRole.ADMIN);
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("Bootstrapped initial administrator account for {}", adminEmail);
        });
    }
}
