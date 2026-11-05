package com.example.chatweb.service;

import com.example.chatweb.dto.RoomResponse;
import com.example.chatweb.entity.Room;
import com.example.chatweb.entity.RoomMember;
import com.example.chatweb.entity.RoomType;
import com.example.chatweb.entity.User;
import com.example.chatweb.exception.ResourceNotFoundException;
import com.example.chatweb.repository.RoomMemberRepository;
import com.example.chatweb.repository.RoomRepository;
import com.example.chatweb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private static final int MAX_MEMBERS = 500;

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    @Transactional
    public RoomResponse createRoom(String username, String name) {
        User owner = findUser(username);

        Room room = new Room();
        room.setName(name.trim());
        room.setType(RoomType.GROUP);
        room.setOwner(owner);
        roomRepository.save(room);

        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(owner);
        member.setRole("OWNER");
        roomMemberRepository.save(member);

        return toResponse(room);
    }

    @Transactional
    public void joinRoom(String username, Long roomId) {
        User user = findUser(username);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("聊天室不存在"));

        if (room.getType() != RoomType.GROUP) {
            throw new AccessDeniedException("该聊天室不允许主动加入");
        }
        if (roomMemberRepository.existsByRoom_IdAndUser_Id(roomId, user.getId())) {
            return; // 已经在里面了，重复加入当作成功
        }
        if (roomMemberRepository.countByRoom_Id(roomId) >= MAX_MEMBERS) {
            throw new IllegalArgumentException("聊天室已满（上限 " + MAX_MEMBERS + " 人）");
        }

        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(user);
        roomMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getMyRooms(String username) {
        User user = findUser(username);
        return roomMemberRepository.findByUser_Id(user.getId()).stream()
                .map(m -> toResponse(m.getRoom()))
                .toList();
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    private RoomResponse toResponse(Room room) {
        return new RoomResponse(room.getId(), room.getName(), room.getType().name());
    }
}