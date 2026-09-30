"use client";

import type { Section, SectionId } from "@/lib/sections";

type DetailPanelProps = {
  section: Section | null;
  open: boolean;
  onClose: () => void;
  selectedItemId: string | null;
  onSelectItem: (id: SectionId, itemId: string) => void;
};

export function DetailPanel({ section, open, onClose, selectedItemId, onSelectItem }: DetailPanelProps) {
  const item = section?.items.find((entry) => entry.id === selectedItemId) ?? null;

  return (
    <div className={`sheet ${open ? "is-open" : ""}`} data-ui>
      <div
        className="sheet-window"
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-label={section ? section.title : "Section"}
        data-scroll
      >
        <button type="button" className="sheet-close" onClick={onClose}>
          Close
        </button>
        {section ? (
          <div key={section.id} className="sheet-body">
            <p className="detail-kicker">
              {section.index} / {section.title}
            </p>
            <h2 className="sheet-title">{item ? item.title : section.title}</h2>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
