package com.example.chatweb.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
        @NotBlank(message = "聊天室名称不能为空")
        @Size(max = 50, message = "聊天室名称最多 50 字")
        String name
) {}
