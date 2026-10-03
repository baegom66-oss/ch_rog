"use client";

import { BookHeart, Check, Lock, Pencil, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import FieldHint from "@/components/FieldHint";
import { inputClass } from "@/components/ProfileFields";
import { createWishId } from "@/data/createCharacter";
import { isWishAlive, WISH_DAILY_PROBABILITY } from "@/lib/dailyWish";
import { formatMonthDay, toDateKey } from "@/lib/date";
import type { CharacterProfile, CharacterWish } from "@/types";

interface SecretDiaryCardProps {
  character: CharacterProfile;
  /** 일기·소원은 프로필 설정이 아니므로 프로필 저장 시각을 바꾸지 않는다 */
  onPatch: (patch: Partial<CharacterProfile>) => void;
}

/** 관찰자 전용 비밀 일기와 소원 */
export default function SecretDiaryCard({ character, onPatch }: SecretDiaryCardProps) {
  const [diaryEditing, setDiaryEditing] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState(character.secretDiary);
  const [wishDrafts, setWishDrafts] = useState<Record<string, string>>({});
  const [newWishDraft, setNewWishDraft] = useState("");
  const [fulfilledWish, setFulfilledWish] = useState("");

  const today = toDateKey(new Date());
  const visibleWishes = character.wishes
    .filter((w) => isWishAlive(w, today))
    .sort((a, b) => Number(a.kept) - Number(b.kept));
  const hasTodayWish = visibleWishes.some((w) => w.date === today);

  const startDiaryEdit = () => {
    setDiaryDraft(character.secretDiary);
    setWishDrafts(Object.fromEntries(character.wishes.map((w) => [w.id, w.text])));
    setNewWishDraft("");
    setDiaryEditing(true);
  };

  const saveDiary = () => {
    const edited = visibleWishes
      .map((w) => ({ ...w, text: (wishDrafts[w.id] ?? w.text).trim() }))
      .filter((w) => w.text);
    const extra = newWishDraft.trim();
    onPatch({
      secretDiary: diaryDraft,
      wishes: extra
        ? [
            ...edited,
            { id: createWishId(character.id), text: extra, date: today, kept: false },
          ]
        : edited,
    });
    setDiaryEditing(false);
  };

  /** 간직을 풀면 지난 소원도 오늘 자정까지는 남겨 둔다 */
  const toggleKept = (wish: CharacterWish) => {
    onPatch({
      wishes: character.wishes.map((w) =>
        w.id === wish.id ? { ...w, kept: !w.kept, date: w.kept ? today : w.date } : w
      ),
    });
  };

  const fulfillWish = (wish: CharacterWish) => {
    onPatch({ wishes: character.wishes.filter((w) => w.id !== wish.id) });
    setFulfilledWish(wish.text);
    window.setTimeout(() => setFulfilledWish(""), 2500);
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-[var(--accent)]" />
        <h2 className="font-[family-name:var(--font-display)] text-sm text-[var(--ink)]">
          관찰자 전용 비밀 일기
        </h2>
        <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] text-[var(--accent)]">
          하루 1회
        </span>
        <FieldHint text="마음에 들지 않거나 캐릭터성에 맞지 않는 일기는 언제든 삭제 및 수정할 수 있습니다. 간직해 둔 소원은 세계 탭에서 그 세계 캐릭터들 것을 모아 볼 수 있어요." />
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
            <BookHeart className="h-3.5 w-3.5" />
            오직 유저만 읽을 수 있는 속마음
          </div>
          <div className="flex items-center gap-1">
            {!diaryEditing ? (
              <>
                <button
                  type="button"
                  onClick={startDiaryEdit}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                >
                  <Pencil className="h-3 w-3" />
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "이 비밀 일기를 삭제하시겠습니까?\n소원은 유지됩니다."
                      )
                    ) {
                      onPatch({ secretDiary: "" });
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-red-600/80 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setDiaryEditing(false)}
                  className="px-2 py-1 text-[10px] text-[var(--muted)]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveDiary}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2 py-1 text-[10px] text-white"
                >
                  <Save className="h-3 w-3" />
                  저장
                </button>
              </>
            )}
          </div>
        </div>
        {diaryEditing ? (
          <textarea
            rows={6}
            value={diaryDraft}
            onChange={(e) => setDiaryDraft(e.target.value)}
            className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-3 font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            placeholder="오늘의 속마음을 적어 주세요."
          />
        ) : (
          <div className="min-h-[6rem] rounded-xl bg-[var(--wash)]/70 px-3 py-3 font-[family-name:var(--font-display)] text-[13px] leading-7 text-[var(--ink)] whitespace-pre-wrap">
            {character.secretDiary.trim() || (
              <span className="text-[var(--muted)]">
                삭제되었거나 아직 작성된 일기가 없습니다.
              </span>
            )}
          </div>
        )}
        <div className="mt-3 rounded-xl border border-dashed border-[var(--accent)]/35 bg-[var(--accent-soft)]/50 px-3 py-3">
          <div className="mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[var(--accent)]" />
            <p className="text-[10px] font-medium tracking-wide text-[var(--accent)]">
              소원
            </p>
            <FieldHint
              text={`오늘의 소원은 매일 생기지 않고 하루 ${Math.round(
                WISH_DAILY_PROBABILITY * 100
              )}% 확률로 가끔 생깁니다. 그대로 두면 자정이 지나면 사라지고, '이룰 때까지 간직하기'를 체크해 두면 '이뤄졌어요'를 누를 때까지 남아 있어요.`}
            />
          </div>

          {fulfilledWish && (
            <p className="mb-2 rounded-lg bg-[var(--card)] px-2.5 py-1.5 text-[11px] text-[var(--accent)]">
              ✨ 소원을 이뤘어요 · {fulfilledWish}
            </p>
          )}

          {visibleWishes.length === 0 && !diaryEditing && (
            <p className="text-[12px] leading-5 text-[var(--muted)]">
              오늘은 떠오른 소원이 없어요. 가끔씩 새 소원이 생겨요.
            </p>
          )}

          <ul className="space-y-2">
            {visibleWishes.map((wish) => (
              <li key={wish.id} className="rounded-lg bg-[var(--card)]/80 px-3 py-2.5">
                <p className="mb-1 text-[10px] text-[var(--muted)]">
                  {wish.kept
                    ? `간직 중${wish.date ? ` · ${formatMonthDay(wish.date)}부터` : ""}`
                    : "오늘의 소원 · 자정이 지나면 사라져요"}
                </p>
                {diaryEditing ? (
                  <textarea
                    rows={2}
                    value={wishDrafts[wish.id] ?? wish.text}
                    onChange={(e) =>
                      setWishDrafts((d) => ({ ...d, [wish.id]: e.target.value }))
                    }
                    className="w-full resize-none bg-transparent text-[12.5px] leading-6 text-[var(--ink)] outline-none"
                    placeholder="비워 두고 저장하면 이 소원은 지워집니다."
                  />
                ) : (
                  <>
                    <p className="text-[12.5px] leading-6 text-[var(--ink)] whitespace-pre-wrap">
                      {wish.text}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-[var(--ink)]">
                        <input
                          type="checkbox"
                          checked={wish.kept}
                          onChange={() => toggleKept(wish)}
                          className="h-3.5 w-3.5 accent-[var(--accent)]"
                        />
                        이룰 때까지 간직하기
                      </label>
                      {wish.kept && (
                        <button
                          type="button"
                          onClick={() => fulfillWish(wish)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[10.5px] font-medium text-white"
                        >
                          <Check className="h-3 w-3" />
                          이뤄졌어요
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {diaryEditing && !hasTodayWish && (
            <textarea
              rows={2}
              value={newWishDraft}
              onChange={(e) => setNewWishDraft(e.target.value)}
              className={`${inputClass} mt-2 bg-[var(--card)]/80 text-[12.5px]`}
              placeholder="오늘의 소원을 직접 적을 수도 있어요. (비워 두면 없음)"
            />
          )}
        </div>
      </div>
    </section>
  );
}
