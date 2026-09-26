"use client";

import {
  Heart,
  ImageIcon,
  ImagePlus,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import CharacterAvatar from "@/components/CharacterAvatar";
import FieldHint from "@/components/FieldHint";
import type { CharacterProfile, SnsComment, SnsPost } from "@/types";

interface SnsTabProps {
  posts: SnsPost[];
  characters: CharacterProfile[];
  activeCharacterId: string;
  onUpdatePost: (id: string, patch: Partial<SnsPost>) => void;
  onAddPost: (post: SnsPost) => void;
  onDeletePost: (id: string) => void;
  onAddComment: (postId: string, comment: SnsComment) => void;
  onUpdateComment: (
    postId: string,
    commentId: string,
    patch: Partial<SnsComment>
  ) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("fail"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SnsTab({
  posts,
  characters,
  activeCharacterId,
  onUpdatePost,
  onAddPost,
  onDeletePost,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: SnsTabProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [composing, setComposing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [draftAuthorId, setDraftAuthorId] = useState(activeCharacterId);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [commentAuthor, setCommentAuthor] = useState(activeCharacterId);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editingCommentKey, setEditingCommentKey] = useState<string | null>(
    null
  );
  const [editCommentText, setEditCommentText] = useState("");
  const composeFileRef = useRef<HTMLInputElement>(null);
  const imageFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const author = characters.find((c) => c.id === draftAuthorId) ?? characters[0];

  const submitPost = () => {
    if (!draftContent.trim() || !author) return;
    const tags = draftTags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    onAddPost({
      id: `sns-${Date.now()}`,
      characterId: author.id,
      authorName: author.name,
      authorColor: author.avatarColor,
      content: draftContent.trim(),
      hashtags: tags,
      imageUrl: draftImage || undefined,
      likes: 0,
      reactions: [],
      comments: [],
      time: nowTime(),
    });
    setDraftContent("");
    setDraftTags("");
    setDraftImage("");
    setComposing(false);
  };

  const submitComment = (postId: string) => {
    const text = (commentDrafts[postId] ?? "").trim();
    const who = characters.find((c) => c.id === commentAuthor);
    if (!text || !who) return;
    onAddComment(postId, {
      id: `c-${Date.now()}`,
      characterId: who.id,
      authorName: who.name,
      authorColor: who.avatarColor,
      content: text,
      time: nowTime(),
    });
    setCommentDrafts((s) => ({ ...s, [postId]: "" }));
  };

  const startEditPost = (post: SnsPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditTags(post.hashtags.join(" "));
  };

  const saveEditPost = (postId: string) => {
    if (!editContent.trim()) return;
    const tags = editTags
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
    onUpdatePost(postId, {
      content: editContent.trim(),
      hashtags: tags,
    });
    setEditingPostId(null);
  };

  return (
    <div className="pb-4">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
              마을 피드
            </h2>
            <FieldHint text="마음에 들지 않거나 캐릭터성에 맞지 않는 게시글·댓글은 언제든 삭제 및 수정할 수 있습니다." />
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            등록된 캐릭터만 글·댓글을 남길 수 있어요
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftAuthorId(activeCharacterId);
            setComposing((v) => !v);
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-[var(--ink)] px-3 py-2 text-[11px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          글쓰기
        </button>
      </div>

      {composing && (
        <div className="space-y-2 border-b border-[var(--line)] bg-[var(--wash)]/50 px-4 py-3">
          <label className="block text-[11px] text-[var(--muted)]">
            작성 캐릭터
            <select
              value={draftAuthorId}
              onChange={(e) => setDraftAuthorId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <textarea
            rows={3}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="무슨 일이 있었나요? (사진 없이도 올릴 수 있어요)"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            type="text"
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            placeholder="해시태그 (예: #카페 #디저트)"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none"
          />
          <input
            ref={composeFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setDraftImage(await readImageFile(file));
              } catch {
                /* ignore */
              }
            }}
          />
          {draftImage ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draftImage}
                alt="첨부 미리보기"
                className="max-h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDraftImage("")}
                className="absolute right-2 top-2 rounded-full bg-[var(--ink)]/70 p-1.5 text-white"
                aria-label="사진 제거"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => composeFileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[11px] text-[var(--muted)] hover:border-[var(--accent)]"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              사진 첨부 (선택)
            </button>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="px-3 py-1.5 text-[11px] text-[var(--muted)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submitPost}
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[11px] text-white"
            >
              게시
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-[var(--line)]">
        {posts.length === 0 && (
          <p className="px-4 py-10 text-center text-xs text-[var(--muted)]">
            게시글이 없습니다. 글쓰기로 새 피드를 올려 보세요.
          </p>
        )}
        {posts.map((post) => {
          const open = expanded[post.id] ?? true;
          const poster = characters.find((c) => c.id === post.characterId);
          const isEditing = editingPostId === post.id;
          return (
            <article key={post.id} className="px-4 py-4">
              <div className="mb-2.5 flex items-center gap-2.5">
                {poster ? (
                  <CharacterAvatar
                    url={poster.avatarUrl}
                    emoji={poster.avatarEmoji}
                    color={poster.avatarColor}
                    name={poster.name}
                    size="sm"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: post.authorColor }}
                  >
                    {post.authorName.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {post.authorName}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">{post.time}</p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      isEditing ? setEditingPostId(null) : startEditPost(post)
                    }
                    className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                    aria-label="게시글 수정"
                    title="수정"
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
                    className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                    aria-label="게시글 삭제"
                    title="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="해시태그"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPostId(null)}
                      className="text-[11px] text-[var(--muted)]"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditPost(post.id)}
                      className="rounded-lg bg-[var(--ink)] px-2.5 py-1 text-[11px] text-white"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[13.5px] leading-6 text-[var(--ink)]">
                    {post.content}
                  </p>
                  {post.hashtags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.hashtags.map((tag) => (
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

              {post.imageUrl ? (
                <div className="relative mt-3 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt={`${post.authorName} 게시 이미지`}
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdatePost(post.id, { imageUrl: "" })}
                    className="absolute right-2 top-2 rounded-full bg-[var(--ink)]/65 px-2 py-1 text-[10px] text-white"
                  >
                    사진 제거
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <input
                    ref={(el) => {
                      imageFileRefs.current[post.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await readImageFile(file);
                        onUpdatePost(post.id, { imageUrl: url });
                      } catch {
                        /* ignore */
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageFileRefs.current[post.id]?.click()}
                    className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--wash)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Upload className="h-5 w-5 opacity-70" />
                    <span className="text-[11px]">사진 넣기 (선택)</span>
                    <span className="inline-flex items-center gap-1 text-[10px] opacity-70">
                      <ImageIcon className="h-3 w-3" />
                      글만 있는 게시물로도 유지 가능
                    </span>
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-[var(--accent)]" />
                    {post.likes}
                  </span>
                  {post.reactions.length > 0 && (
                    <span className="tracking-wider">
                      {post.reactions.join(" ")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((s) => ({ ...s, [post.id]: !open }))
                  }
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  댓글 {post.comments.length}
                </button>
              </div>

              {open && (
                <div className="mt-3 space-y-2.5 border-l-2 border-[var(--line)] pl-3">
                  {post.comments.map((comment) => {
                    const who = characters.find(
                      (c) => c.id === comment.characterId
                    );
                    const cKey = `${post.id}:${comment.id}`;
                    const isCEdit = editingCommentKey === cKey;
                    return (
                      <div key={comment.id} className="flex gap-2">
                        {who ? (
                          <CharacterAvatar
                            url={who.avatarUrl}
                            emoji={who.avatarEmoji}
                            color={who.avatarColor}
                            name={who.name}
                            size="xs"
                          />
                        ) : (
                          <div
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                            style={{ backgroundColor: comment.authorColor }}
                          >
                            {comment.authorName.slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-[var(--ink)]">
                              {comment.authorName}
                            </span>
                            <span className="text-[10px] text-[var(--muted)]">
                              {comment.time}
                            </span>
                            <span className="ml-auto flex gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isCEdit) {
                                    setEditingCommentKey(null);
                                  } else {
                                    setEditingCommentKey(cKey);
                                    setEditCommentText(comment.content);
                                  }
                                }}
                                className="rounded p-1 text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                                aria-label="댓글 수정"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "이 댓글을 삭제하시겠습니까?"
                                    )
                                  ) {
                                    onDeleteComment(post.id, comment.id);
                                  }
                                }}
                                className="rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                                aria-label="댓글 삭제"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </span>
                          </div>
                          {isCEdit ? (
                            <div className="mt-1 space-y-1.5">
                              <textarea
                                rows={2}
                                value={editCommentText}
                                onChange={(e) =>
                                  setEditCommentText(e.target.value)
                                }
                                className="w-full rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-[12.5px] outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentKey(null)}
                                  className="text-[10px] text-[var(--muted)]"
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editCommentText.trim()) return;
                                    onUpdateComment(post.id, comment.id, {
                                      content: editCommentText.trim(),
                                    });
                                    setEditingCommentKey(null);
                                  }}
                                  className="rounded-md bg-[var(--ink)] px-2 py-0.5 text-[10px] text-white"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[12.5px] leading-5 text-[var(--ink)]/85">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="space-y-1.5 pt-1">
                    <select
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="w-full rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2 py-1.5 text-[11px] outline-none"
                    >
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}(으)로 댓글
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentDrafts[post.id] ?? ""}
                        onChange={(e) =>
                          setCommentDrafts((s) => ({
                            ...s,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submitComment(post.id);
                          }
                        }}
                        placeholder="댓글 남기기…"
                        className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--wash)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => submitComment(post.id)}
                        className="shrink-0 rounded-lg bg-[var(--ink)] px-2.5 text-[11px] text-white"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
