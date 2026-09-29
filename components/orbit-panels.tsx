"use client";

import type { PanelNodeMap } from "@/components/volleyball-scene";
import { sections, type SectionId } from "@/lib/sections";

type OrbitPanelsProps = {
  activeId: SectionId;
  panelNodes: React.RefObject<PanelNodeMap>;
  onOpenSection: (id: SectionId) => void;
  onOpenItem: (id: SectionId, itemId: string) => void;
};

export function OrbitPanels({ activeId, panelNodes, onOpenSection, onOpenItem }: OrbitPanelsProps) {
  return (
    <div className="orbit-layer">
      {sections.map((section) => (
        <div
          key={section.id}
          className={`orbit-panel ${section.id === activeId ? "is-front" : ""}`}
          data-ui
          data-panel={section.id}
          ref={(node) => {
            panelNodes.current[section.id] = node;
          }}
        >
          <button type="button" className="orbit-mark" onClick={() => onOpenSection(section.id)}>
            <span className="orbit-index">{section.index}</span>
            <span className="orbit-title">{section.title}</span>
          </button>
          <div className="orbit-reveal">
            <div className="orbit-reveal-inner">
              <ul className="orbit-list">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => onOpenItem(section.id, item.id)}>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
