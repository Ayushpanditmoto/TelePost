"use client";

import React from "react";
import styled from "styled-components";
import { useDashboardStore } from "@/store/dashboardStore";
import type { Post } from "@/hooks/usePosts";
import { formatPostTime } from "@/lib/mockData";

const Card = styled.article<{ $selected: boolean; $status: string }>`
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.bg.messageSelected : theme.colors.bg.message};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 14px 8px;
  margin: 2px 12px;
  cursor: pointer;
  border: 1px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.border.accent : "transparent"};
  transition:
    background ${({ theme }) => theme.transition.fast},
    border-color ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};
  position: relative;

  &:hover {
    background: ${({ $selected, theme }) =>
      $selected
        ? theme.colors.bg.messageSelected
        : theme.colors.bg.messageHover};
    transform: translateX(2px);
  }
`;

const Content = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};

  ${({ $status, theme }) => {
    switch ($status) {
      case "scheduled":
        return `
          color: ${theme.colors.status.scheduled};
          background: ${theme.colors.status.scheduledBg};
        `;
      case "published":
        return `
          color: ${theme.colors.status.published};
          background: ${theme.colors.status.publishedBg};
        `;
      case "failed":
        return `
          color: ${theme.colors.status.failed};
          background: ${theme.colors.status.failedBg};
        `;
      case "draft":
        return `
          color: ${theme.colors.status.draft};
          background: ${theme.colors.status.draftBg};
        `;
      default:
        return `
          color: ${theme.colors.text.muted};
          background: transparent;
        `;
    }
  }}
`;

const Timestamp = styled.time`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.timestamp};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "🕐 Scheduled",
  published: "✓ Published",
  failed: "✕ Failed",
  draft: "○ Draft",
  publishing: "⟳ Publishing",
  cancelled: "— Cancelled",
};

interface MessageCardProps {
  post: Post;
}

export default function MessageCard({ post }: MessageCardProps) {
  const { selectedPostId, setSelectedPostId } = useDashboardStore();
  const isSelected = selectedPostId === post.id;

  const handleClick = () => {
    if (isSelected) {
      setSelectedPostId(null);
    } else {
      setSelectedPostId(post.id);
    }
  };

  return (
    <Card
      $selected={isSelected}
      $status={post.status}
      onClick={handleClick}
      id={`message-card-${post.id}`}
    >
      <Content>{post.content}</Content>

      <Meta>
        <StatusBadge $status={post.status}>
          {STATUS_LABELS[post.status] ?? post.status}
        </StatusBadge>
        <Timestamp
          dateTime={post.scheduledAt ?? post.publishedAt ?? post.createdAt}
        >
          {formatPostTime(post)}
        </Timestamp>
      </Meta>
    </Card>
  );
}
