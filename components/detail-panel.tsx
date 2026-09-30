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
            <h2 className="sheet-title">{section.title}</h2>
            <p className="detail-body">{section.lede}</p>
            <ul className="detail-list">
              {section.items.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-current={entry.id === selectedItemId ? "true" : undefined}
                    onClick={() => {
                      onSelectItem(section.id, entry.id);
                      document.getElementById(`${section.id}-${entry.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {entry.title}
                  </button>
                </li>
              ))}
            </ul>
            {section.items.map((entry) => (
              <article
                key={entry.id}
                id={`${section.id}-${entry.id}`}
                className={`detail-block ${entry.id === selectedItemId ? "is-selected" : ""}`}
              >
                <h3>{entry.title}</h3>
                {entry.meta ? <p className="detail-meta">{entry.meta}</p> : null}
                <p className="detail-body">{entry.body}</p>
                {entry.points ? (
                  <ul className="detail-points">
                    {entry.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {entry.href ? (
                  <a className="detail-link" href={entry.href}>
                    {entry.linkLabel}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
