package com.example.chatweb.service;

import com.example.chatweb.dto.ChatMessage;
import com.example.chatweb.dto.MessagePageResponse;
import com.example.chatweb.dto.SendMessageRequest;
import com.example.chatweb.entity.Message;
import com.example.chatweb.entity.User;
import com.example.chatweb.exception.ResourceNotFoundException;
import com.example.chatweb.repository.MessageRepository;
import com.example.chatweb.repository.RoomMemberRepository;
import com.example.chatweb.repository.RoomRepository;
import com.example.chatweb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_CONTENT_LENGTH = 2000;
    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void sendMessage(String username, SendMessageRequest request) {
        if (request.roomId() == null || request.content() == null) {
            throw new IllegalArgumentException("参数不完整");
        }
        String content = request.content().trim();
        if (content.isEmpty()) {
            throw new IllegalArgumentException("消息不能为空");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("消息过长，最多 " + MAX_CONTENT_LENGTH + " 字");
        }

        User sender = findUser(username);
        requireMember(request.roomId(), sender.getId());

        Message message = new Message();
        message.setRoom(roomRepository.getReferenceById(request.roomId()));
        message.setSender(sender);
        message.setContent(content);
        Message saved = messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/room/" + request.roomId(),
                toDto(saved, request.roomId())
        );
    }

    @Transactional(readOnly = true)
    public MessagePageResponse getHistory(String username, Long roomId, int page, int size) {
        User user = findUser(username);
        requireMember(roomId, user.getId());

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(
                safePage, safeSize,
                Sort.by(Sort.Order.desc("sentAt"), Sort.Order.desc("id"))
        );

        Slice<Message> slice = messageRepository.findByRoom_Id(roomId, pageable);
        List<ChatMessage> content = slice.getContent().stream()
                .map(m -> toDto(m, roomId))
                .toList();
        return new MessagePageResponse(content, slice.hasNext());
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private void requireMember(Long roomId, Long userId) {
        if (!roomMemberRepository.existsByRoom_IdAndUser_Id(roomId, userId)) {
            throw new AccessDeniedException("你不是该聊天室的成员");
        }
    }

    private ChatMessage toDto(Message message, Long roomId) {
        ChatMessage dto = new ChatMessage();
        dto.setId(message.getId());
        dto.setRoomId(roomId);
        dto.setContent(message.getContent());
        dto.setSenderUsername(message.getSender().getUsername());
        dto.setType("CHAT");
        dto.setSentAt(message.getSentAt().toString());
        return dto;
    }
}