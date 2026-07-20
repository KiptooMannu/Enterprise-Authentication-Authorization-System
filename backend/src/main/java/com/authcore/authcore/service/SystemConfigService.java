package com.authcore.authcore.service;

import com.authcore.authcore.entity.SystemConfig;
import com.authcore.authcore.repository.SystemConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    public SystemConfigService(SystemConfigRepository systemConfigRepository) {
        this.systemConfigRepository = systemConfigRepository;
    }

    public SystemConfig getConfig(String key) {
        return systemConfigRepository.findByConfigKey(key).orElse(null);
    }

    public String getConfigValue(String key) {
        Optional<SystemConfig> config = systemConfigRepository.findByConfigKey(key);
        return config.map(SystemConfig::getConfigValue).orElse(null);
    }

    public Integer getConfigValueAsInt(String key) {
        String value = getConfigValue(key);
        if (value != null) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public Boolean getConfigValueAsBoolean(String key) {
        String value = getConfigValue(key);
        if (value != null) {
            return Boolean.parseBoolean(value);
        }
        return null;
    }

    public List<SystemConfig> getConfigsByCategory(String category) {
        return systemConfigRepository.findByCategory(category);
    }

    public Map<String, String> getAllConfigs() {
        Map<String, String> configs = new HashMap<>();
        systemConfigRepository.findAll().forEach(config -> 
            configs.put(config.getConfigKey(), config.getConfigValue())
        );
        return configs;
    }

    public Map<String, String> getConfigsByCategoryMap(String category) {
        Map<String, String> configs = new HashMap<>();
        systemConfigRepository.findByCategory(category).forEach(config -> 
            configs.put(config.getConfigKey(), config.getConfigValue())
        );
        return configs;
    }

    public SystemConfig createOrUpdateConfig(String key, String value, String category, String description) {
        Optional<SystemConfig> existingConfig = systemConfigRepository.findByConfigKey(key);
        
        if (existingConfig.isPresent()) {
            SystemConfig config = existingConfig.get();
            config.setConfigValue(value);
            config.setCategory(category);
            config.setDescription(description);
            return systemConfigRepository.save(config);
        } else {
            SystemConfig newConfig = new SystemConfig(key, value, category, description);
            return systemConfigRepository.save(newConfig);
        }
    }

    public void deleteConfig(String key) {
        systemConfigRepository.findByConfigKey(key).ifPresent(systemConfigRepository::delete);
    }

    public void initializeDefaultConfigs() {
        // Security Policies
        createOrUpdateConfig("security.password.min_length", "8", "security", "Minimum password length");
        createOrUpdateConfig("security.password.history_limit", "5", "security", "Password history limit");
        createOrUpdateConfig("security.session.timeout", "30", "security", "Session timeout in minutes");
        createOrUpdateConfig("security.max_failed_attempts", "5", "security", "Maximum failed login attempts");

        // Account Lockout
        createOrUpdateConfig("lockout.enabled", "true", "lockout", "Enable account lockout");
        createOrUpdateConfig("lockout.duration", "30", "lockout", "Lockout duration in minutes");
        createOrUpdateConfig("lockout.auto_unlock", "60", "lockout", "Auto-unlock after in minutes");

        // Data Retention
        createOrUpdateConfig("retention.audit_logs", "90", "retention", "Audit log retention in days");
        createOrUpdateConfig("retention.login_history", "30", "retention", "Login history retention in days");
        createOrUpdateConfig("retention.session_data", "7", "retention", "Session data retention in days");

        // System Configuration
        createOrUpdateConfig("system.jwt.expiration", "15", "system", "JWT expiration in minutes");
        createOrUpdateConfig("system.refresh_token.expiration", "7", "system", "Refresh token expiration in days");
    }
}
