package com.example.chatweb.config;

import com.example.chatweb.entity.User;
import com.example.chatweb.repository.RoomMemberRepository;
import com.example.chatweb.repository.UserRepository;
import com.example.chatweb.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final String ROOM_TOPIC_PREFIX = "/topic/room/";

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            checkSubscription(accessor);
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new MessagingException("缺少 token");
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) {
            throw new MessagingException("token 无效");
        }
        String username = jwtUtil.getUsernameFromToken(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()));
    }

    private void checkSubscription(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        String destination = accessor.getDestination();
        if (principal == null || destination == null) {
            throw new MessagingException("未认证的订阅");
        }

        // 只允许订阅自己所在房间的 topic，其他目的地一律拒绝（默认拒绝）
        if (!destination.startsWith(ROOM_TOPIC_PREFIX)) {
            throw new MessagingException("不允许订阅该地址");
        }

        Long roomId;
        try {
            roomId = Long.parseLong(destination.substring(ROOM_TOPIC_PREFIX.length()));
        } catch (NumberFormatException e) {
            throw new MessagingException("订阅地址格式错误");
        }

        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new MessagingException("用户不存在"));
        if (!roomMemberRepository.existsByRoom_IdAndUser_Id(roomId, user.getId())) {
            throw new MessagingException("你不是该聊天室的成员，不能订阅");
        }
    }
}