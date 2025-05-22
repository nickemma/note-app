package com.techieemma.note_app.controller;

import com.techieemma.note_app.entity.User;
import com.techieemma.note_app.repository.UserRepository;
import com.techieemma.note_app.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
    try {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username already exists");
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userRepository.save(user);
            String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId());
            return ResponseEntity.ok(new AuthResponse(token, savedUser.getId(), savedUser.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
       }

    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
    try {
        User existingUser = userRepository.findByUsername(user.getUsername()).orElse(null);
        if (existingUser == null || !passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid credentials");
        }
          String token = jwtUtil.generateToken(existingUser.getUsername(), existingUser.getId());
          return ResponseEntity.ok(new AuthResponse(token, existingUser.getId(), existingUser.getUsername()));
       } catch(Exception e) {
          return ResponseEntity.status(500).body("Login failed: " + e.getMessage());
       }
    }

    static class AuthResponse {
        private String token;
        private Long userId;
        private String username;

        public AuthResponse(String token, Long userId, String username) {
            this.token = token;
            this.userId = userId;
            this.username = username;
        }

        public String getToken() { return token; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
    }
}