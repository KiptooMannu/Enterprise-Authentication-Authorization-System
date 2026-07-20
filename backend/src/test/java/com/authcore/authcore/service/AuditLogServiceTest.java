package com.authcore.authcore.service;

import com.authcore.authcore.entity.AuditLog;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void logEventShouldPersistAuditLogWithProvidedFields() {
        UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

        auditLogService.logEvent(user, "LOGIN", "USER", 7L, "10.0.0.1", "successful login");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertSame(user, saved.getUser());
        assertEquals("LOGIN", saved.getAction());
        assertEquals("USER", saved.getEntityType());
        assertEquals(7L, saved.getEntityId());
        assertEquals("10.0.0.1", saved.getIpAddress());
        assertEquals("successful login", saved.getDetails());
    }

    @Test
    void getUserAuditLogsShouldDelegateToRepository() {
        UserEntity user = new UserEntity("jane", "jane@example.com", "hash");
        List<AuditLog> logs = List.of(new AuditLog(user, "LOGIN", "USER", 1L, "ip", "details"));
        when(auditLogRepository.findByUser(user)).thenReturn(logs);

        assertSame(logs, auditLogService.getUserAuditLogs(user));
    }

    @Test
    void getUserAuditLogsSinceShouldDelegateToRepository() {
        UserEntity user = new UserEntity("jane", "jane@example.com", "hash");
        Instant since = Instant.now().minusSeconds(60);
        List<AuditLog> logs = List.of(new AuditLog(user, "LOGIN", "USER", 1L, "ip", "details"));
        when(auditLogRepository.findByUserSince(user, since)).thenReturn(logs);

        assertSame(logs, auditLogService.getUserAuditLogsSince(user, since));
    }

    @Test
    void getAllAuditLogsShouldDelegateToRepository() {
        List<AuditLog> logs = List.of();
        when(auditLogRepository.findAllOrderByTimestampDesc()).thenReturn(logs);

        assertSame(logs, auditLogService.getAllAuditLogs());
    }

    @Test
    void getAuditLogsByActionShouldDelegateToRepository() {
        List<AuditLog> logs = List.of();
        when(auditLogRepository.findByAction("DELETE")).thenReturn(logs);

        assertSame(logs, auditLogService.getAuditLogsByAction("DELETE"));
    }
}
