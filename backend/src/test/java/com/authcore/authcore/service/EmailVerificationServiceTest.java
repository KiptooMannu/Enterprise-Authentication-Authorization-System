package com.authcore.authcore.service;

import com.authcore.authcore.entity.EmailVerification;
import com.authcore.authcore.entity.UserEntity;
import com.authcore.authcore.repository.EmailVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationRepository repository;

    @Mock
    private JavaMailSender mailSender;

    private EmailVerificationService service;

    private final UserEntity user = new UserEntity("jane", "jane@example.com", "hash");

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(repository);
    }

    @Test
    void createVerificationTokenShouldClearExistingAndSaveNew() {
        when(repository.save(any(EmailVerification.class))).thenAnswer(i -> i.getArgument(0));

        EmailVerification created = service.createVerificationToken(user);

        verify(repository).deleteByUser(user);
        assertNotNull(created.getToken());
        assertTrue(created.getExpiryDate().isAfter(Instant.now().plus(23, ChronoUnit.HOURS)));
        // no mail sender configured -> no email sent
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void createVerificationTokenShouldSendEmailWhenMailSenderConfigured() {
        service.setMailSender(mailSender);
        when(repository.save(any(EmailVerification.class))).thenAnswer(i -> i.getArgument(0));

        service.createVerificationToken(user);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void verifyEmailShouldReturnFalseForUnknownToken() {
        when(repository.findByToken("missing")).thenReturn(Optional.empty());

        assertFalse(service.verifyEmail("missing"));
    }

    @Test
    void verifyEmailShouldReturnTrueForAlreadyVerifiedToken() {
        EmailVerification verification = new EmailVerification("t", user,
                Instant.now().plus(1, ChronoUnit.HOURS));
        verification.setVerified(true);
        when(repository.findByToken("t")).thenReturn(Optional.of(verification));

        assertTrue(service.verifyEmail("t"));
        verify(repository, never()).save(any(EmailVerification.class));
    }

    @Test
    void verifyEmailShouldDeleteAndReturnFalseForExpiredToken() {
        EmailVerification verification = new EmailVerification("t", user,
                Instant.now().minus(1, ChronoUnit.HOURS));
        when(repository.findByToken("t")).thenReturn(Optional.of(verification));

        assertFalse(service.verifyEmail("t"));
        verify(repository).deleteByToken("t");
    }

    @Test
    void verifyEmailShouldMarkVerifiedAndEnableUserForValidToken() {
        user.setEnabled(false);
        EmailVerification verification = new EmailVerification("t", user,
                Instant.now().plus(1, ChronoUnit.HOURS));
        when(repository.findByToken("t")).thenReturn(Optional.of(verification));

        assertTrue(service.verifyEmail("t"));

        ArgumentCaptor<EmailVerification> captor = ArgumentCaptor.forClass(EmailVerification.class);
        verify(repository).save(captor.capture());
        assertTrue(captor.getValue().isVerified());
        assertTrue(user.isEnabled());
    }

    @Test
    void findByTokenShouldDelegateToRepository() {
        EmailVerification verification = new EmailVerification("t", user, Instant.now());
        when(repository.findByToken("t")).thenReturn(Optional.of(verification));

        assertTrue(service.findByToken("t").isPresent());
    }
}
