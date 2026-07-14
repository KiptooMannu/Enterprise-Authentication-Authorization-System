package com.authcore.authcore.service;

import com.authcore.authcore.entity.AuditLog;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logEvent(UserEntity user, String action, String entityType, Long entityId, String ipAddress, String details) {
        AuditLog log = new AuditLog(user, action, entityType, entityId, ipAddress, details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getUserAuditLogs(UserEntity user) {
        return auditLogRepository.findByUser(user);
    }

    public List<AuditLog> getUserAuditLogsSince(UserEntity user, Instant since) {
        return auditLogRepository.findByUserSince(user, since);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllOrderByTimestampDesc();
    }

    public List<AuditLog> getAuditLogsByAction(String action) {
        return auditLogRepository.findByAction(action);
    }
}
