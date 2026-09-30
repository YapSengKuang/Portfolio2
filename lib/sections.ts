export type SectionId = "projects" | "about" | "contact";

export type SectionItem = {
  id: string;
  title: string;
  meta?: string;
  body: string;
  points?: string[];
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
    lede: "Software built across web, mobile, games, and research. Most of it shipped with a team, a client, or a deploy pipeline.",
    items: [
      {
        id: "daily-chess",
        title: "Daily Chess",
        meta: "Personal project · Sep 2026 – present",
        body: "A Wordle-style daily chess puzzle, one unique 3–6 move Lichess puzzle each UTC day.",
        href: "http://daily-chess-rho.vercel.app",
        linkLabel: "Play Daily Chess",
        points: [
          "Built and deployed in Next.js, React, and TypeScript, with a shareable colour-block result and a streak.",
          "Guest play, plus optional Firebase Authentication (email, password, and Google) and Cloud Firestore, with a localStorage fallback for attempts, lives, and streaks.",
          "Cut first-load JavaScript by about 62% (317 kB to 121 kB) by deferring Firebase and the chessboard, splitting puzzle-theme data, and caching pages where it was safe.",
          "Hardened the app with rate-limited API routes and security headers, including a Content Security Policy.",
          "Shipped Archive, Random, and Stats, a Motion-based menu, and settings for theme, sound, and pixel or classic pieces.",
          "GitHub and Vercel: every push to the project branch triggers a production build.",
        ],
      },
      {
        id: "qeeri",
        title: "Northstar",
        meta: "Qeeri AI · Feb 2024 – Nov 2024",
        body: "A full-stack career guidance platform on Azure, used for student assessments.",
        points: [
          "Supported 20+ student assessment interactions across React, C#, and Python services.",
          "Integrated Azure OpenAI to read uploaded PDFs, DOCX, XLSX, and CSV files and turn them into personalised career insights.",
          "Built ASP.NET APIs on Azure App Service, with Azure SQL for accounts, assessment data, and prompts.",
          "Recommended 10+ career paths with salary, automation risk, and reasoning drawn from the assessment.",
          "Worked in an 8+ person Agile team with CI/CD and third-party integrations, and wrote the architecture and API notes for the next developers.",
          "Sat with stakeholders each week to lock requirements and deliver against them.",
        ],
      },
      {
        id: "honours",
        title: "Honours research",
        meta: "Exertion Games Lab, Monash · Feb 2024 – Nov 2024",
        body: "A year-long capstone in a four-person team, focused on VR and human-computer interaction.",
        href: "https://github.com/XUBOI2806/VR-Soccer-FYP",
        linkLabel: "View the repository",
        points: [
          "Built interactive simulations and test environments in Unity with C#, and ran usability tests with 20+ participants.",
          "Analysed 100+ data points with hypothesis testing to judge how the VR system performed.",
          "Wrote a 10,000+ word final report covering the literature and the software design. The project received a Distinction.",
        ],
      },
      {
        id: "ar-glasses",
        title: "Shopping assistant for AR glasses",
        meta: "Monash · CSIRO · Mar 2023 – Nov 2023",
        body: "An augmented-reality proof of concept that helps someone find an item while they shop.",
        href: "https://github.com/YapSengKuang/AR-Glasses",
        linkLabel: "View on GitHub",
        points: [
          "Implemented a YOLO object-detection pipeline in Unity and linked it to Nreal AR glasses for an external client.",
          "Worked in a 15+ person cross-functional team using the Scaled Agile Framework.",
          "Pilot tests cut item-finding time by 30–40%, measured from detection accuracy and how quickly the glasses responded.",
          "Unit Award Commendation for the highest grade in Software Engineering Practice (FIT3170).",
        ],
      },
      {
        id: "clothing-tracker",
        title: "Clothing Tracker",
        meta: "Monash · iOS · Feb 2023 – Jul 2023",
        body: "An iPhone app for keeping track of clothes without a spreadsheet.",
        points: [
          "Designed and built it in Swift with UIKit, Core Data, and Xcode.",
          "Usability tests with 10+ people shaped the interface and what the app actually did.",
          "Cut the time people spent tracking clothes by hand by about 70%.",
        ],
      },
      {
        id: "pacman",
        title: "Adversarial search for Pac-Man",
        meta: "Monash · Mar 2023 – Nov 2023",
        body: "Search agents that play Pac-Man by planning against the ghosts.",
        points: [
          "Wrote Minimax and alpha-beta pruning agents in Python, with evaluation functions aimed at staying alive, eating pellets, and avoiding ghosts.",
          "Started from a reflex agent and refined the heuristics across 15+ mazes, checked in 300+ simulated matches.",
          "Documented the design choices and the results in a report and a reproducible codebase.",
        ],
      },
      {
        id: "nine-mens-morris",
        title: "Nine Men's Morris",
        meta: "Monash · Feb 2023 – Jun 2023",
        body: "A Java implementation of the board game, built with two teammates.",
        href: "https://github.com/YapSengKuang/9MMGame",
        linkLabel: "View on GitHub",
        points: [
          "Modelled the game with object-oriented design, and set up CI/CD while working in Agile sprints.",
          "Weekly planning kept the team at 9+ tasks a sprint.",
          "Turned 10+ game concepts into classes and components, and kept the product notes current as features landed.",
        ],
      },
      {
        id: "earlier-portfolio",
        title: "Earlier portfolio",
        meta: "Personal project · Feb 2025",
        body: "A previous site for showing front-end work and 3D scenes.",
        href: "https://github.com/YapSengKuang/Portfolio",
        linkLabel: "View on GitHub",
        points: [
          "Built with React, Three.js, and Tailwind, then hosted on Amazon S3 and Cloudflare.",
          "GitHub fed an automated pipeline so updates shipped without a manual release.",
        ],
      },
    ],
  },
  {
    id: "about",
    index: "02",
    title: "About",
    lede: "Graduate software engineer. I build across web, mobile, and simulation, usually inside an Agile team that already has a pipeline.",
    items: [
      {
        id: "summary",
        title: "Seng Kuang Yap",
        meta: "Graduate software engineer",
        body: "Strong foundations in object-oriented design, Java, C++, React, and TypeScript. I like turning a real system into software: modules, models, and the multi-threaded or framework-based pieces that hold them together.",
        points: [
          "Bachelor of Engineering (Honours), Monash University Clayton, March 2020 – March 2025.",
          "Unit Award Commendation: highest grade in Software Engineering Practice (FIT3170).",
          "Coursework included software engineering practice, architecture and design, algorithms and data structures, operating systems, computer networks, and computer architecture.",
        ],
      },
      {
        id: "experience",
        title: "Experience",
        meta: "Before and alongside the degree",
        body: "Most of the paid work has been with people, in rooms where the system has to keep moving.",
        points: [
          "Incu, sales assistant, May 2022 – present. High-end retail, about 50 stakeholders a day, and a 23% weekly sales uplift. Used AP21 to keep inventory available, and styled content for a 200+ online audience that lifted product-specific sales by 18%.",
          "Doncaster Secondary College, student IT technician, February 2017 – November 2018. Support and maintenance for 1,200+ users, preventative work across 28+ devices an hour, and LAN setup so classrooms stayed connected.",
          "Spotlight, sales assistant, February 2022 – May 2022. 30–40 customers a shift, 50+ POS transactions, and a faster checkout after payment and pricing issues were cleared on the spot.",
        ],
      },
      {
        id: "skills",
        title: "Skills",
        meta: "Languages, platforms, and the tools around them",
        body: "The stack changes with the project. These are the ones I reach for.",
        points: [
          "Languages: Python, TypeScript, JavaScript, SQL, C++, Java, Swift, C#.",
          "Web and mobile: Next.js, React, HTML/CSS, Node.js, REST APIs, SwiftUI, UIKit, Core Data.",
          "Libraries: PyTorch, OpenCV, Core ML, Pandas, NumPy, chess.js, react-chessboard, Motion.",
          "Cloud and delivery: Firebase, Firestore, Vercel, GCP, AWS, Azure, Docker, GitHub Actions, CI/CD.",
          "Also: Linux, Git, Xcode, Jira, Figma, and the security and performance work that keeps a web app shippable.",
        ],
      },
    ],
  },
  {
    id: "contact",
    index: "03",
    title: "Contact",
    lede: "Graduate software engineer based around Melbourne. The fastest reply is email.",
    items: [
      {
        id: "email",
        title: "Email",
        body: "sengkuangyap153@gmail.com",
        href: "mailto:sengkuangyap153@gmail.com",
        linkLabel: "Send email",
      },
      {
        id: "linkedin",
        title: "LinkedIn",
        body: "linkedin.com/in/seng-kuang-yap",
        href: "https://www.linkedin.com/in/seng-kuang-yap",
        linkLabel: "Open LinkedIn",
      },
      {
        id: "github",
        title: "GitHub",
        body: "github.com/YapSengKuang",
        href: "https://github.com/YapSengKuang",
        linkLabel: "Open GitHub",
      },
      {
        id: "site",
        title: "Site",
        body: "sengkuangyap.com",
        href: "https://sengkuangyap.com/",
        linkLabel: "Open site",
      },
    ],
  },
];

export function sectionById(id: string) {
  return sections.find((section) => section.id === id);
}
