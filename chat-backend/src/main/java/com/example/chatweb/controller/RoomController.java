package com.example.chatweb.controller;

import com.example.chatweb.dto.CreateRoomRequest;
import com.example.chatweb.dto.MessagePageResponse;
import com.example.chatweb.dto.RoomResponse;
import com.example.chatweb.service.ChatService;
import com.example.chatweb.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final ChatService chatService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@Valid @RequestBody CreateRoomRequest request, Principal principal) {
        return roomService.createRoom(principal.getName(), request.name());
    }

    @GetMapping
    public List<RoomResponse> myRooms(Principal principal) {
        return roomService.getMyRooms(principal.getName());
    }

    @PostMapping("/{roomId}/join")
    public Map<String, String> join(@PathVariable Long roomId, Principal principal) {
        roomService.joinRoom(principal.getName(), roomId);
        return Map.of("message", "已加入聊天室");
    }

    @GetMapping("/{roomId}/messages")
    public MessagePageResponse history(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        return chatService.getHistory(principal.getName(), roomId, page, size);
    }
}