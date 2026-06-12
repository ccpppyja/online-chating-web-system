package com.example.chatweb.controller;

import com.example.chatweb.entity.User;
import com.example.chatweb.repository.UserRepository;
import com.example.chatweb.util.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    record RegisterRequest(
            @NotBlank(message = "username cannot be empty")
            @Size(min = 3, max = 50, message = "Username length: 3–50 characters")
            String username,

            @NotBlank(message = "Password cannot be empty.")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            @NotBlank(message = "email can not be empty")
            @Email(message = "Invalid email format.")
            String email
    ) {}

    record LoginRequest(
            @NotBlank(message = "username cannot be empty")
            String username,

            @NotBlank(message = "password cannot be empty")
            String password
    ) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "username already exists"));
        }
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "the email address has already been registered"));
        }

        User user = new User();
        user.setUsername(req.username());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setEmail(req.email());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username(), req.password())
                    );

        } catch (AuthenticationException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Incorrect username or password"));
        }

        User user = userRepository.findByUsername(req.username()).orElseThrow();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "id", user.getId()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @org.springframework.security.core.annotation.AuthenticationPrincipal
            org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        return ResponseEntity.ok(Map.of("username", userDetails.getUsername()));
    }

}