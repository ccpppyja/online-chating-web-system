package com.example.chatweb.repository;

import com.example.chatweb.entity.RoomMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    boolean existsByRoom_IdAndUser_Id(Long roomId, Long userId);    //是不是群成员？发消息前的权限校验用

    Optional<RoomMember> findByRoom_IdAndUser_Id(Long roomId, Long userId);

    long countByRoom_Id(Long roomId);   //房间当前人数，限制 500 人上限时用

    @EntityGraph(attributePaths = "room")
    List<RoomMember> findByUser_Id(Long userId);

    @EntityGraph(attributePaths = "user")
    List<RoomMember> findByRoom_Id(Long roomId);
}
