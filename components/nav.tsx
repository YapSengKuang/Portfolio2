"use client";

import { sections, type SectionId } from "@/lib/sections";

type NavProps = {
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
};

export function Nav({ activeId, onSelect }: NavProps) {
  return (
    <header className="nav" data-ui>
      <a
        href="#projects"
        className="nav-name"
        onClick={(event) => {
          event.preventDefault();
          onSelect("projects");
        }}
      >
        Seng
      </a>
      <nav aria-label="Sections">
        <ul className="nav-links">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={section.id === activeId ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(section.id);
                }}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
