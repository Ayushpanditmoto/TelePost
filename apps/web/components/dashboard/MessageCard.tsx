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
  max-width: min(76%, 560px);
  margin: 2px 14px;
  /* Never let a flex layout squish a bubble below its content height — with
     overflow:hidden the squish clips text mid-line instead of scrolling. */
  flex-shrink: 0;
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
  /* No line-clamp: a bubble's height must always fit its full content, like
     Telegram. The full text is never truncated in the feed. */
`;

const Meta = styled.div`
  /* Telegram-style: one compact, right-aligned line — a status glyph (plus a
     short label only for non-published states) next to the timestamp, instead
     of a full-width pill row eating bubble space. */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 3px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: default;

  ${({ $status, theme }) => {
    switch ($status) {
      case "scheduled":
        return `color: ${theme.colors.status.scheduled};`;
      case "published":
        return `color: ${theme.colors.status.published};`;
      case "failed":
        return `color: ${theme.colors.status.failed};`;
      case "draft":
        return `color: ${theme.colors.status.draft};`;
      case "publishing":
        return `color: ${theme.colors.status.publishing};`;
      default:
        return `color: ${theme.colors.text.muted};`;
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

// Badge shown when one bubble stands in for a whole recurring series
// ("Repeat daily" submissions collapse into this instead of N date bubbles).
const SeriesChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};

  .series-extra {
    color: ${({ theme }) => theme.colors.text.muted};
    font-weight: ${({ theme }) => theme.font.weight.normal};
  }
`;

const STATUS_LABELS: Record<string, string> = {
  scheduled: "🕐 Scheduled",
  published: "✓ Published",
  failed: "✕ Failed",
  draft: "○ Draft",
  publishing: "⟳ Publishing",
  cancelled: "— Cancelled",
};

// Compact feed rendering: glyph always, short text label only for states that
// need explaining (published — the common case — stays glyph + time).
const STATUS_GLYPHS: Record<string, string> = {
  scheduled: "🕐",
  published: "✓",
  failed: "✕",
  draft: "○",
  publishing: "⟳",
  cancelled: "—",
};

const STATUS_SHORT: Record<string, string> = {
  scheduled: "Scheduled",
  failed: "Failed",
  draft: "Draft",
  publishing: "Publishing",
  cancelled: "Cancelled",
};

interface MessageCardProps {
  post: Post;
  /** Present when this bubble represents a whole recurring series. */
  series?: { label: string; extra?: string | null } | null;
}

export default function MessageCard({ post, series }: MessageCardProps) {
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
        {series && (
          <SeriesChip>
            <span aria-hidden="true">🔁</span>
            <span>{series.label}</span>
            {series.extra && (
              <span className="series-extra">· {series.extra}</span>
            )}
          </SeriesChip>
        )}
        {hasText && <Content>{post.content}</Content>}

        <Meta>
          <StatusBadge
            $status={post.status}
            title={STATUS_LABELS[post.status] ?? post.status}
          >
            {post.status === "publishing" ? (
              <>
                <PublishingGlyph>⟳</PublishingGlyph>
                <span>Publishing</span>
              </>
            ) : (
              <>
                <span aria-hidden="true">
                  {STATUS_GLYPHS[post.status] ?? "•"}
                </span>
                {post.status !== "published" && (
                  <span>{STATUS_SHORT[post.status]}</span>
                )}
              </>
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
