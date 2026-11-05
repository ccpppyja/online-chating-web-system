package com.example.chatweb.dto;

public record SendMessageRequest(Long roomId, String content) {
}
