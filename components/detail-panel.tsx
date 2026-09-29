"use client";

import { sections, type Section, type SectionId } from "@/lib/sections";

type DetailPanelProps = {
  section: Section;
  selectedItemId: string | null;
  onSelectItem: (id: SectionId, itemId: string) => void;
};

export function DetailPanel({ section, selectedItemId, onSelectItem }: DetailPanelProps) {
  const item = section.items.find((entry) => entry.id === selectedItemId) ?? null;

  return (
    <aside className="detail" data-ui data-scroll id={section.id} aria-label={section.title}>
      <p className="detail-kicker">
        {section.index} / {section.title}
      </p>
      <h1 className="detail-title">{item ? item.title : section.title}</h1>
      <p className="detail-body">{item ? item.body : section.lede}</p>
      {item?.href ? (
        <a className="detail-link" href={item.href}>
          {item.linkLabel}
        </a>
      ) : null}
      <ul className="detail-list">
        {section.items.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              aria-current={entry.id === selectedItemId ? "true" : undefined}
              onClick={() => onSelectItem(section.id, entry.id)}
            >
              {entry.title}
            </button>
          </li>
        ))}
      </ul>
      <p className="sr-only">
        Showing {sections.find((entry) => entry.id === section.id)?.title}.
      </p>
    </aside>
  );
}
