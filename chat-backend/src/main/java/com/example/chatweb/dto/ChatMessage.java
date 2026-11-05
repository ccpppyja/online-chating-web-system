package com.example.chatweb.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private Long id;
    private Long roomId;
    private String content;
    private String senderUsername;
    private String type; // "CHAT" 普通消息 / "JOIN" 加入 / "LEAVE" 离开
    private String sentAt;
}
