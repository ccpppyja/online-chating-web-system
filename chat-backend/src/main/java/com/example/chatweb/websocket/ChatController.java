package com.example.chatweb.websocket;

import com.example.chatweb.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message, Principal principal) {
        message.setSenderUsername(principal.getName());
        message.setType("CHAT");
        messagingTemplate.convertAndSend(
                "/topic/room/" + message.getRoomId(),
                message
        );
    }

    @MessageMapping("/chat.join")
    public void joinRoom(@Payload ChatMessage message, Principal principal) {
        message.setSenderUsername(principal.getName());
        message.setType("JOIN");
        message.setContent(principal.getName() + "joined chatroom");
        messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId(),
                message
        );
    }
}
