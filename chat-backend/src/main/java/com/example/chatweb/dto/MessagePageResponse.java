package com.example.chatweb.dto;

import java.util.List;

public record MessagePageResponse(List<ChatMessage> content, boolean hasNext){
}
