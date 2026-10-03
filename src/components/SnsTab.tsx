"use client";

import {
  Heart,
  ImageIcon,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Repeat2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import CharacterStoryBar from "@/components/CharacterStoryBar";
import FieldHint from "@/components/FieldHint";
import { SNS_FAVORITE_MAX, SNS_POST_LIMIT } from "@/data/dummy";
import { formatCount, getSnsProfile, parseCount } from "@/data/snsProfile";
import { readImageAsDataUrl } from "@/lib/image";
import { formatMonthDay, toDateKey } from "@/lib/date";
import { postSortKey } from "@/lib/postRetention";
import { SNS_HASHTAG_MAX } from "@/lib/text";
import { SNS_AUTO_POSTS_PER_DAY } from "@/lib/snsAutoPost";
import type {
  CharacterProfile,
  SnsComment,
  SnsPost,
  SnsProfile,
} from "@/types";

interface SnsTabProps {
  posts: SnsPost[];
  characters: CharacterProfile[];
  selectedId: string;
  onSelectCharacter: (id: string) => void;
  onUpdateSnsProfile: (characterId: string, sns: SnsProfile) => void;
  onUpdatePost: (id: string, patch: Partial<SnsPost>) => void;
  onDeletePost: (id: string) => void;
  onTogglePostFavorite: (id: string) => void;
  autoPostEnabled: boolean;
  onToggleAutoPost: (enabled: boolean) => void;
}

const POST_IMAGE_MAX_SIZE = 1080;

function parseHashtags(raw: string): string[] {
  const tags = raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);
  return [...new Set(tags)].slice(0, SNS_HASHTAG_MAX);
}

/** 오늘 글은 시각만, 지난 글은 날짜까지 표시 */
function formatPostTime(post: SnsPost, today: string) {
  if (!post.date || post.date === today) return post.time;
  return `${formatMonthDay(post.date)} ${post.time}`;
}

function AuthorAvatar({
  character,
  fallbackName,
  fallbackColor,
  size,
}: {
  character?: CharacterProfile;
  fallbackName: string;
  fallbackColor: string;
  size: "xs" | "sm";
}) {
  if (character) {
    return (
      <CharacterAvatar
        url={character.avatarUrl}
        color={character.avatarColor}
        name={character.name}
        size={size}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
        size === "xs" ? "h-6 w-6 text-[9px]" : "h-10 w-10 text-xs"
      }`}
      style={{ backgroundColor: fallbackColor }}
    >
      {fallbackName.slice(0, 1)}
    </div>
  );
}

/* ───────────── 프로필 헤더 ───────────── */

function SnsProfileHeader({
  character,
  postCount,
  onSave,
}: {
  character: CharacterProfile;
  postCount: number;
  onSave: (sns: SnsProfile) => void;
}) {
  const profile = getSnsProfile(character);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ followers: "", following: "", bio: "" });

  const startEdit = () => {
    setDraft({
      followers: String(profile.followers),
      following: String(profile.following),
      bio: profile.bio,
    });
    setEditing(true);
  };

  const save = () => {
    onSave({
      followers: parseCount(draft.followers) ?? profile.followers,
      following: parseCount(draft.following) ?? profile.following,
      bio: draft.bio.trim(),
    });
    setEditing(false);
  };

  const stats = [
    { label: "게시물", value: postCount, editable: false },
    { label: "팔로워", value: profile.followers, editable: true },
    { label: "팔로잉", value: profile.following, editable: true },
  ];

  return (
    <section className="border-b border-[var(--line)] bg-[var(--card)] px-4 pb-4 pt-4">
      <div className="flex items-center gap-5">
        <CharacterAvatar
          url={character.avatarUrl}
          color={character.avatarColor}
          name={character.name}
          size="md"
          className="h-20! w-20! text-4xl!"
        />
        <div className="grid flex-1 grid-cols-3 text-center">
          {stats.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={!s.editable}
              onClick={startEdit}
              className="rounded-xl py-1.5 transition enabled:hover:bg-[var(--wash)] disabled:cursor-default"
              title={s.editable ? `${s.label} 수 수정` : undefined}
            >
              <p className="text-[17px] font-bold tabular-nums text-[var(--ink)]">
                {formatCount(s.value)}
              </p>
              <p className="text-[11px] text-[var(--muted)]">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-bold text-[var(--ink)]">
            {character.name}
          </h2>
          {character.mbti && (
            <span className="rounded-md bg-[var(--wash)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
              {character.mbti}
            </span>
          )}
        </div>
        {profile.bio ? (
          <p className="mt-1 whitespace-pre-line text-[13px] leading-5 text-[var(--ink)]/85">
            {profile.bio}
          </p>
        ) : (
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            아직 소개글이 없어요.
          </p>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2 rounded-xl bg-[var(--wash)] p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-[var(--muted)]">
              팔로워
              <input
                type="number"
                min={0}
                value={draft.followers}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, followers: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm tabular-nums text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="text-[11px] text-[var(--muted)]">
              팔로잉
              <input
                type="number"
                min={0}
                value={draft.following}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, following: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm tabular-nums text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </label>
          </div>
          <label className="block text-[11px] text-[var(--muted)]">
            소개
            <textarea
              rows={2}
              value={draft.bio}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-[11px] text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="mt-3 w-full rounded-lg bg-[var(--wash)] py-2 text-[12px] font-semibold text-[var(--ink)] hover:bg-[var(--line)]"
        >
          프로필 편집
        </button>
      )}
    </section>
  );
}

/* ───────────── 게시물 카드 ───────────── */

function SharedPostEmbed({
  original,
  characters,
  today,
}: {
  original?: SnsPost;
  characters: CharacterProfile[];
  today: string;
}) {
  if (!original) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-[var(--line)] px-3 py-4 text-center text-[11px] text-[var(--muted)]">
        원본 게시물이 삭제되었거나 볼 수 없어요.
      </div>
    );
  }
  const who = characters.find((c) => c.id === original.characterId);
  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-3">
      <div className="flex items-center gap-2">
        <AuthorAvatar
          character={who}
          fallbackName={original.authorName}
          fallbackColor={original.authorColor}
          size="xs"
        />
        <span className="text-[12px] font-semibold text-[var(--ink)]">
          {original.authorName}
        </span>
        <span className="text-[10px] text-[var(--muted)]">
          {formatPostTime(original, today)}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-4 text-[13px] leading-6 text-[var(--ink)]">
        {original.content}
      </p>
      {original.hashtags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {original.hashtags.slice(0, SNS_HASHTAG_MAX).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium text-[var(--accent)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {original.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={original.imageUrl}
          alt={`${original.authorName} 게시 이미지`}
          className="mt-2 aspect-[16/9] w-full rounded-xl object-cover"
        />
      )}
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
        <Heart className="h-3 w-3" />
        {original.likes.toLocaleString("ko-KR")}
      </p>
    </div>
  );
}

interface PostDraft {
  content: string;
  tags: string;
  likes: string;
  imageUrl: string;
  comments: SnsComment[];
}

const fieldClass =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";

function CommentRow({
  comment,
  characters,
  action,
  children,
}: {
  comment: SnsComment;
  characters: CharacterProfile[];
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <AuthorAvatar
        character={characters.find((c) => c.id === comment.characterId)}
        fallbackName={comment.authorName}
        fallbackColor={comment.authorColor}
        size="xs"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--ink)]">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-[var(--muted)]">
            {comment.time}
          </span>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function SnsPostCard({
  post,
  characters,
  original,
  today,
  canFavorite,
  onUpdatePost,
  onDeletePost,
  onToggleFavorite,
}: {
  post: SnsPost;
  characters: CharacterProfile[];
  original?: SnsPost;
  today: string;
  /** 즐겨찾기 해제는 항상, 추가는 자리가 남았을 때만 */
  canFavorite: boolean;
  onUpdatePost: SnsTabProps["onUpdatePost"];
  onDeletePost: SnsTabProps["onDeletePost"];
  onToggleFavorite: SnsTabProps["onTogglePostFavorite"];
}) {
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const poster = characters.find((c) => c.id === post.characterId);
  const isShare = Boolean(post.sharedPostId);
  const editing = draft !== null;
  const canSave = draft !== null && (isShare || draft.content.trim() !== "");

  const startEdit = () =>
    setDraft({
      content: post.content,
      tags: post.hashtags.join(" "),
      likes: String(post.likes),
      imageUrl: post.imageUrl ?? "",
      comments: post.comments.map((c) => ({ ...c })),
    });

  const saveEdit = () => {
    if (!draft || !canSave) return;
    onUpdatePost(post.id, {
      content: draft.content.trim(),
      hashtags: parseHashtags(draft.tags),
      likes: parseCount(draft.likes) ?? post.likes,
      imageUrl: isShare ? post.imageUrl : draft.imageUrl,
      comments: draft.comments
        .map((c) => ({ ...c, content: c.content.trim() }))
        .filter((c) => c.content),
    });
    setDraft(null);
  };

  const patchDraft = (patch: Partial<PostDraft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const updateDraftComment = (id: string, content: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            comments: d.comments.map((c) =>
              c.id === id ? { ...c, content } : c
            ),
          }
        : d
    );

  const removeDraftComment = (id: string) =>
    setDraft((d) =>
      d ? { ...d, comments: d.comments.filter((c) => c.id !== id) } : d
    );

  return (
    <article
      className={`feed-card px-4 py-3.5 ${post.eventId ? "event-frame" : ""} ${
        editing ? "ring-2 ring-[var(--accent)]/40" : ""
      }`}
    >
      {isShare && (
        <p className="mb-2 flex items-center gap-1 text-[11px] font-medium text-[var(--muted)]">
          <Repeat2 className="h-3.5 w-3.5" />
          {post.authorName}님이 공유함
        </p>
      )}
      <div className="mb-2.5 flex items-center gap-3">
        <AuthorAvatar
          character={poster}
          fallbackName={post.authorName}
          fallbackColor={post.authorColor}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {post.authorName}
          </p>
          <p className="text-[11px] text-[var(--muted)]">
            {formatPostTime(post, today)}
          </p>
        </div>
        {editing ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--muted)] hover:bg-[var(--wash)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={!canSave}
              title={canSave ? undefined : "본문을 입력해 주세요"}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
            >
              저장
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={!canFavorite}
              onClick={() => onToggleFavorite(post.id)}
              className={`rounded-full p-1 text-sm leading-none transition hover:bg-[var(--wash)] disabled:cursor-not-allowed disabled:opacity-30 ${
                post.isFavorite ? "" : "opacity-35 grayscale hover:opacity-70"
              }`}
              aria-label={post.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
              aria-pressed={Boolean(post.isFavorite)}
              title={
                canFavorite
                  ? post.isFavorite
                    ? "즐겨찾기 해제"
                    : "즐겨찾기 · 오래돼도 지워지지 않아요"
                  : `즐겨찾기가 가득 찼어요 (${SNS_FAVORITE_MAX}개)`
              }
            >
              <span aria-hidden>⭐</span>
            </button>
            <button
              type="button"
              onClick={startEdit}
              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              aria-label="게시글 수정"
              title="게시글·좋아요·사진·댓글 수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "이 게시글을 삭제하시겠습니까?\n댓글 타래도 함께 삭제됩니다."
                  )
                ) {
                  onDeletePost(post.id);
                }
              }}
              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
              aria-label="게시글 삭제"
              title="삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {draft ? (
        <div className="space-y-2.5">
          <label className="block text-[11px] text-[var(--muted)]">
            {isShare ? "공유하며 한마디" : "본문"}
            <textarea
              rows={3}
              value={draft.content}
              onChange={(e) => patchDraft({ content: e.target.value })}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <div className="grid grid-cols-[1fr_6.5rem] gap-2">
            <label className="block text-[11px] text-[var(--muted)]">
              해시태그
              <input
                type="text"
                value={draft.tags}
                onChange={(e) => patchDraft({ tags: e.target.value })}
                placeholder="#카페 #디저트"
                className={`mt-1 ${fieldClass}`}
              />
            </label>
            <label className="block text-[11px] text-[var(--muted)]">
              좋아요 수
              <input
                type="number"
                min={0}
                value={draft.likes}
                onChange={(e) => patchDraft({ likes: e.target.value })}
                className={`mt-1 tabular-nums ${fieldClass}`}
              />
            </label>
          </div>
        </div>
      ) : (
        <>
          {post.content && (
            <p className="text-[13.5px] leading-6 text-[var(--ink)]">
              {post.content}
            </p>
          )}
          {post.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.hashtags.slice(0, SNS_HASHTAG_MAX).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {isShare ? (
        <SharedPostEmbed
          original={original}
          characters={characters}
          today={today}
        />
      ) : draft ? (
        <div className="mt-3">
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                patchDraft({
                  imageUrl: await readImageAsDataUrl(file, POST_IMAGE_MAX_SIZE),
                });
              } catch {
                /* 이미지가 아니거나 읽기 실패 */
              }
            }}
          />
          {draft.imageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--line)]/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.imageUrl}
                alt="첨부 이미지"
                className="aspect-[4/3] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => patchDraft({ imageUrl: "" })}
                className="absolute right-2 top-2 rounded-full bg-[var(--ink)]/65 px-2 py-1 text-[10px] text-white"
              >
                사진 제거
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageFileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] py-3 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Upload className="h-4 w-4 opacity-70" />
              <span className="text-[11px]">사진 넣기 (선택)</span>
              <span className="hidden items-center gap-1 text-[10px] opacity-70 sm:inline-flex">
                <ImageIcon className="h-3 w-3" />
                글만 있는 게시물로도 유지 가능
              </span>
            </button>
          )}
        </div>
      ) : (
        post.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)]/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={`${post.authorName} 게시 이미지`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        )
      )}

      <div className="-mx-4 mt-3 flex items-center justify-between border-t border-[var(--line)]/70 px-4 pt-2.5">
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-4 w-4 fill-current text-[#e0245e]" />
            <span className="font-semibold tabular-nums text-[var(--ink)]">
              좋아요 {post.likes.toLocaleString("ko-KR")}개
            </span>
          </span>
          {post.reactions.length > 0 && (
            <span className="tracking-wider">{post.reactions.join(" ")}</span>
          )}
        </div>
        {post.comments.length > 0 && !editing && (
          <button
            type="button"
            onClick={() => setCommentsOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            댓글 {post.comments.length}
          </button>
        )}
      </div>

      {draft
        ? draft.comments.length > 0 && (
            <div className="mt-3 space-y-2 rounded-2xl bg-[var(--paper)] px-3 py-3">
              <p className="text-[11px] text-[var(--muted)]">
                댓글 수정 · 내용을 비우거나 ✕를 누르면 삭제돼요
              </p>
              {draft.comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  characters={characters}
                  action={
                    <button
                      type="button"
                      onClick={() => removeDraftComment(comment.id)}
                      className="ml-auto rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                      aria-label="댓글 삭제"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  }
                >
                  <textarea
                    rows={2}
                    value={comment.content}
                    onChange={(e) =>
                      updateDraftComment(comment.id, e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-[12.5px] outline-none focus:border-[var(--accent)]"
                  />
                </CommentRow>
              ))}
            </div>
          )
        : commentsOpen &&
          post.comments.length > 0 && (
            <div className="mt-3 space-y-2.5 rounded-2xl bg-[var(--paper)] px-3 py-3">
              {post.comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  characters={characters}
                >
                  <p className="text-[12.5px] leading-5 text-[var(--ink)]/85">
                    {comment.content}
                  </p>
                </CommentRow>
              ))}
            </div>
          )}
    </article>
  );
}

/* ───────────── 탭 ───────────── */

export default function SnsTab({
  posts,
  characters,
  selectedId,
  onSelectCharacter,
  onUpdateSnsProfile,
  onUpdatePost,
  onDeletePost,
  onTogglePostFavorite,
  autoPostEnabled,
  onToggleAutoPost,
}: SnsTabProps) {
  const selected =
    characters.find((c) => c.id === selectedId) ?? characters[0];

  const postsById = useMemo(
    () => new Map(posts.map((p) => [p.id, p])),
    [posts]
  );

  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts)
      counts[p.characterId] = (counts[p.characterId] ?? 0) + 1;
    return counts;
  }, [posts]);

  const today = toDateKey(new Date());
  const profilePosts = useMemo(
    () =>
      posts
        .filter((p) => p.characterId === selected?.id)
        .sort((a, b) => postSortKey(b, today).localeCompare(postSortKey(a, today))),
    [posts, selected?.id, today]
  );

  if (!selected) return null;
  const favoriteCount = profilePosts.filter((p) => p.isFavorite).length;
  const favoritesFull = favoriteCount >= SNS_FAVORITE_MAX;

  return (
    <div className="pb-4">
      <CharacterStoryBar
        characters={characters}
        value={selected.id}
        onChange={onSelectCharacter}
        logCounts={postCounts}
        showAll={false}
      />

      <SnsProfileHeader
        key={`profile-${selected.id}`}
        character={selected}
        postCount={profilePosts.length}
        onSave={(sns) => onUpdateSnsProfile(selected.id, sns)}
      />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
            게시물
          </h2>
          <FieldHint text="게시글 우측 상단 ✏️ 버튼으로 본문·해시태그·좋아요 수·사진·댓글을 한 번에 수정할 수 있어요." />
          <span className="ml-auto text-[11px] tabular-nums text-[var(--muted)]">
            보관 {profilePosts.length}/{SNS_POST_LIMIT} · ⭐ {favoriteCount}/{SNS_FAVORITE_MAX}
          </span>
        </div>
        <p className="mt-1 text-[10.5px] leading-4 text-[var(--muted)]">
          캐릭터마다 최신 {SNS_POST_LIMIT}개까지 보관하고, 넘치면 오래된 글부터 사라져요. ⭐ 즐겨찾기한
          글은 남지만 그만큼 보관 자리를 차지해요.
        </p>
        {favoritesFull && (
          <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
            즐겨찾기 {SNS_FAVORITE_MAX}개가 가득 차서 {selected.name}의 새 게시물이 올라오지 않아요.
            즐겨찾기를 하나 이상 해제하면 다시 올라와요.
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--wash)] px-3 py-2">
          <Sparkles
            className={`h-3.5 w-3.5 shrink-0 ${
              autoPostEnabled ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          />
          <p className="min-w-0 flex-1 text-[11px] text-[var(--ink)]">
            {autoPostEnabled
              ? `자동 게시 중 · 캐릭터당 하루 ${SNS_AUTO_POSTS_PER_DAY.min}~${SNS_AUTO_POSTS_PER_DAY.max}개`
              : "자동 게시가 종료되었어요"}
          </p>
          <button
            type="button"
            onClick={() => onToggleAutoPost(!autoPostEnabled)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              autoPostEnabled
                ? "bg-[var(--card)] text-[var(--ink)] hover:bg-red-50 hover:text-red-600"
                : "bg-[var(--accent)] text-white"
            }`}
          >
            {autoPostEnabled ? (
              <>
                <Pause className="h-3 w-3" />
                생성 종료
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                다시 시작
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3 px-3 pt-3">
        {profilePosts.length === 0 && (
          <p className="feed-card px-4 py-10 text-center text-xs text-[var(--muted)]">
            {selected.name}의 게시물이 아직 없어요.
          </p>
        )}
        {profilePosts.map((post) => (
          <SnsPostCard
            key={post.id}
            post={post}
            characters={characters}
            original={
              post.sharedPostId ? postsById.get(post.sharedPostId) : undefined
            }
            today={today}
            canFavorite={Boolean(post.isFavorite) || !favoritesFull}
            onUpdatePost={onUpdatePost}
            onDeletePost={onDeletePost}
            onToggleFavorite={onTogglePostFavorite}
          />
        ))}
      </div>
    </div>
  );
}
