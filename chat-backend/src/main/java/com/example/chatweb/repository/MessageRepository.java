package com.example.chatweb.repository;

import com.example.chatweb.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @EntityGraph(attributePaths = "sender")
    Slice<Message> findByRoom_Id(Long roomId, Pageable pageable);
}
