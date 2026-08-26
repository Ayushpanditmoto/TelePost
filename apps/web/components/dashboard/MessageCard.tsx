"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { useDashboardStore } from "@/store/dashboardStore";
import { postMediaUrl, type Post } from "@/hooks/usePosts";
import { formatPostTime } from "@/lib/mockData";

const cardIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// ─── Telegram-style chat bubble ──────────────────────────────────────────────
const Card = styled.article<{ $selected: boolean; $hasMedia: boolean }>`
  align-self: flex-start;
  width: fit-content;
  max-width: min(76%, 480px);
  margin: 2px 14px;
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.bg.messageSelected : theme.colors.bg.message};
  /* One tight corner mimics the Telegram message tail. */
  border-radius: 16px;
  border-bottom-left-radius: 5px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
  opacity: 0;
  animation: ${cardIn} 0.25s ease both;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.22);
  transition:
    background ${({ theme }) => theme.transition.fast},
    border-color ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ $selected, theme }) =>
      $selected
        ? theme.colors.bg.messageSelected
        : theme.colors.bg.messageHover};
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
  }

  ${({ $selected, theme }) =>
    $selected
      ? `border-color: ${theme.colors.border.accent};
         box-shadow: 0 0 0 1px ${theme.colors.border.accent}, 0 4px 16px rgba(33, 150, 243, 0.18);`
      : ""}
`;

const MediaGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) => ($count > 1 ? 'repeat(2, 1fr)' : '1fr')};
  gap: 2px;
  background: ${({ theme }) => theme.colors.bg.tertiary};

  img,
  video {
    display: block;
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`;

const UnsupportedFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Caption = styled.div<{ $bare: boolean }>`
  /* Compact vertical padding so short messages stay short. Left/right stays at
     12px. Media case gets an even smaller top since the image sits above. */
  padding: ${({ $bare }) => ($bare ? '4px 12px 3px' : '7px 12px 3px')};
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
  margin-top: 3px;
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
      case "publishing":
        return `
          color: ${theme.colors.status.scheduled};
          background: ${theme.colors.status.scheduledBg};
        `;
      default:
        return `
          color: ${theme.colors.text.muted};
          background: transparent;
        `;
    }
  }}
`;

const PublishingGlyph = styled.span`
  display: inline-block;
  animation: ${spin} 1.2s linear infinite;
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
  const media = post.media ?? [];
  const hasMedia = media.length > 0;
  const hasText = post.content.trim().length > 0;

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
      $hasMedia={hasMedia}
      onClick={handleClick}
      id={`message-card-${post.id}`}
    >
      {hasMedia && (
        <MediaGrid $count={Math.min(media.length, 4)}>
          {media.slice(0, 4).map((m) => {
            if (m.mimeType.startsWith("image/")) {
              // Auth-cookie stream from our API; next/image cannot optimize
              // credentialed same-session endpoints, so raw <img> is intended.
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={postMediaUrl(m.id)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              );
            }
            if (m.mimeType.startsWith("video/")) {
              return (
                <video
                  key={m.id}
                  src={postMediaUrl(m.id)}
                  controls
                  preload="metadata"
                />
              );
            }
            return <UnsupportedFile key={m.id}>📎 Unsupported file</UnsupportedFile>;
          })}
        </MediaGrid>
      )}

      <Caption $bare={hasMedia && hasText}>
        {hasText && <Content>{post.content}</Content>}

        <Meta>
          <StatusBadge $status={post.status}>
            {post.status === "publishing" ? (
              <>
                <PublishingGlyph>⟳</PublishingGlyph> Publishing
              </>
            ) : (
              (STATUS_LABELS[post.status] ?? post.status)
            )}
          </StatusBadge>
          <Timestamp
            dateTime={post.scheduledAt ?? post.publishedAt ?? post.createdAt}
          >
            {formatPostTime(post)}
          </Timestamp>
        </Meta>
      </Caption>
    </Card>
  );
}
