export type SectionId = "projects" | "about" | "contact";

export type SectionItem = {
  id: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
};

export type Section = {
  id: SectionId;
  index: string;
  title: string;
  lede: string;
  items: SectionItem[];
};

export const sections: Section[] = [
  {
    id: "projects",
    index: "01",
    title: "Projects",
    lede: "Selected work. Turn the ball, or choose a section above.",
    items: [
      {
        id: "courtline",
        title: "Courtline",
        body: "Scheduling for a neighborhood volleyball league. Courts, subs, and a night-of board that stays readable under gym lights.",
      },
      {
        id: "signal-desk",
        title: "Signal Desk",
        body: "An on-call inbox that groups alerts by cause, so a noisy hour becomes one story instead of fifty tabs.",
      },
      {
        id: "field-notes",
        title: "Field Notes",
        body: "A writing space for engineering decisions. Each note keeps the diagram, the tradeoff, and the date it stopped being true.",
      },
    ],
  },
  {
    id: "about",
    index: "02",
    title: "About",
    lede: "Software engineer. I like interfaces that feel finished, including the moment before they load.",
    items: [
      {
        id: "practice",
        title: "Practice",
        body: "I design and build web products, from the interface down to the systems that keep them honest.",
      },
      {
        id: "focus",
        title: "Focus",
        body: "Most of the work is product UI, APIs, and the quiet edges: empty states, loading, and what happens when the network is slow.",
      },
      {
        id: "currently",
        title: "Currently",
        body: "Looking for problems where craft shows. This site is a small one: a ball you can turn, and not resize.",
      },
    ],
  },
  {
    id: "contact",
    index: "03",
    title: "Contact",
    lede: "Sample links for this starter. Swap them for the real ones when the site is yours.",
    items: [
      {
        id: "email",
        title: "Email",
        body: "seng@example.com — a placeholder address until a real one is ready.",
        href: "mailto:seng@example.com",
        linkLabel: "Send email",
      },
      {
        id: "github",
        title: "GitHub",
        body: "Code and notes live on GitHub.",
        href: "https://github.com",
        linkLabel: "Open GitHub",
      },
      {
        id: "linkedin",
        title: "LinkedIn",
        body: "The longer version of the work history.",
        href: "https://www.linkedin.com",
        linkLabel: "Open LinkedIn",
      },
    ],
  },
];

export function sectionById(id: string) {
  return sections.find((section) => section.id === id);
}
