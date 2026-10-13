import { BookOpen } from "lucide-react";
import { GUIDE_PLACES, GUIDE_WORLD } from "@/data/worlds";

/** 보기 전용. 캐릭터가 살지 않고, 직접 만든 세계의 기준이 되는 현대 한국 */
export default function GuideWorldView() {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
        <BookOpen className="h-3 w-3" />
        가이드 · 읽기 전용
      </p>
      <h2 className="mt-3 flex items-center gap-2 font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
        <span className="text-xl">{GUIDE_WORLD.emoji}</span>
        {GUIDE_WORLD.name}
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-[var(--ink)]">{GUIDE_WORLD.lore}</p>
      <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
        이 세계에는 캐릭터가 살지 않고, 시간도 흐르지 않아요. 직접 만든 세계의 세계관을
        비워 두면 타임라인과 SNS가 이 현대 한국 일상을 기준으로 써져요. 다른 시대나
        장르를 원하면 그 세계 설명에 적으면 됩니다.
      </p>

      <h3 className="mb-2 mt-4 text-[12px] font-semibold text-[var(--ink)]">이런 장소가 있어요</h3>
      <ul className="space-y-2">
        {GUIDE_PLACES.map((place) => (
          <li key={place.name} className="rounded-xl bg-[var(--wash)] px-3 py-2.5">
            <p className="text-[12px] font-medium text-[var(--ink)]">
              {place.name}
              <span className="ml-1.5 text-[10px] font-normal text-[var(--muted)]">{place.type}</span>
            </p>
            <p className="mt-0.5 text-[11.5px] leading-5 text-[var(--muted)]">{place.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
