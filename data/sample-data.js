/* Sample data for the Tailor interface mockup.
   SYNTHETIC. Written for this prototype. No real resume, employer, posting, or person.
   This file is loaded with a plain <script> tag so index.html works from file://. */

window.TAILOR_DATA = {
  meta: {
    label: "SYNTHETIC",
    product: "Tailor",
    byline: "Christian Leonard De Guzman · Romm James Cuya · James Marius Panado · Samuel Eisyss Odoño",
    note: "One resume, six listings, all invented for this exercise."
  },

  resume: {
    name: "Sample Candidate A",
    file: "sample_resume.md",
    chars: 1680,
    lines: 38,
    sections: [
      {
        id: "sec-contact", key: "contact", label: "Contact", confidence: 0.87,
        heading: "CONTACT",
        lines: ["Sample Candidate A", "candidate@example.com | +63 000 000 0000 | Quezon City, PH",
                "portfolio: example.com/sample-a"],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'CONTACT' is in the lexicon for contact",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like an email address or phone number"]
      },
      {
        id: "sec-summary", key: "summary", label: "Summary", confidence: 0.87,
        heading: "SUMMARY",
        lines: ["Frontend developer with two years of experience building web interfaces in JavaScript and React.",
                "Comfortable translating design files into accessible components and improving page performance.",
                "Looking for a product team where I can own small features end to end."],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'SUMMARY' is in the lexicon for summary",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like short prose lines with no bullets"]
      },
      {
        id: "sec-skills", key: "skills", label: "Skills", confidence: 0.87,
        heading: "SKILLS",
        lines: ["JavaScript, React, HTML, CSS, TypeScript (basic), Jest, Git, Figma, REST APIs, Webpack"],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'SKILLS' is in the lexicon for skills",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like a comma-separated list"]
      },
      {
        id: "sec-experience", key: "experience", label: "Experience", confidence: 0.87,
        heading: "EXPERIENCE",
        lines: [
          "Frontend Developer — Northwind Canvas (synthetic), 2024–present",
          "- Rebuilt the checkout form in React, reducing validation errors reported by support",
          "- Added keyboard navigation and focus states to the account settings screens",
          "- Cut initial bundle size by splitting routes and removing unused imports",
          "- Wrote component tests in Jest for the pricing calculator",
          "",
          "Junior Web Developer — Blue Harbor Studio (synthetic), 2023–2024",
          "- Maintained 12 client marketing sites built with HTML, CSS, and JavaScript",
          "- Converted Figma mockups into responsive layouts for mobile and desktop",
          "- Fixed cross-browser layout defects reported after releases"
        ],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'EXPERIENCE' is in the lexicon for experience",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like a year range or employer-and-role lines"]
      },
      {
        id: "sec-projects", key: "projects", label: "Projects", confidence: 0.87,
        heading: "PROJECTS",
        lines: ["Accessible Form Kit — open-source component set",
                "- Published form controls with visible labels, error text, and keyboard support",
                "- Documented usage with three example pages"],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'PROJECTS' is in the lexicon for projects",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like bullets with no dates"]
      },
      {
        id: "sec-education", key: "education", label: "Education", confidence: 0.87,
        heading: "EDUCATION",
        lines: ["BS Information Technology — Sample State University (synthetic), 2019–2023"],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'EDUCATION' is in the lexicon for education",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "+0.10 content: looks like a degree or qualification word"]
      },
      {
        id: "sec-certifications", key: "certifications", label: "Certifications", confidence: 0.45,
        heading: "CERTIFICATIONS",
        lines: [],
        reasons: ["+0.30 base: a block boundary was found",
                  "+0.30 heading: 'CERTIFICATIONS' is in the lexicon for certifications",
                  "+0.12 shape: all upper case",
                  "+0.05 shape: three words or fewer",
                  "-0.15 content: nothing sits under the heading",
                  "capped at 0.45: an empty section is flagged for a person, not trusted"]
      }
    ],
    unclassified: {
      heading: "VOLUNTEER WORK",
      lines: ["Community coding workshop facilitator, 2023",
              "- Ran four weekend sessions on HTML basics for first-year students"],
      message: "Not one of the seven modelled sections. Kept and shown, but never used as matching evidence."
    }
  },

  keywordGroups: [
    { name: "Frontend", terms: [
      { term: "React", count: 3, where: "Summary line 11 · Skills line 16 · Experience line 20" },
      { term: "HTML", count: 2, where: "Skills line 16 · Experience line 26" },
      { term: "CSS", count: 2, where: "Skills line 16 · Experience line 26" },
      { term: "Accessibility", count: 2, where: "Experience line 21 (keyboard navigation, focus states)" },
      { term: "TypeScript", count: 1, where: "Skills line 16" },
      { term: "Webpack", count: 1, where: "Skills line 16" },
      { term: "Performance", count: 3, where: "Summary line 12 · Experience line 22" }
    ]},
    { name: "Languages", terms: [
      { term: "JavaScript", count: 3, where: "Summary line 11 · Skills line 16 · Experience line 26" },
      { term: "Python", count: 0, where: "not present", missing: true }
    ]},
    { name: "Tools", terms: [
      { term: "Git", count: 1, where: "Skills line 16" },
      { term: "Jest", count: 3, where: "Skills line 16 · Experience line 23" },
      { term: "Figma", count: 4, where: "Summary line 12 · Skills line 16 · Experience line 27" }
    ]},
    { name: "Practice", terms: [
      { term: "Testing", count: 1, where: "Experience line 23" },
      { term: "Design systems", count: 1, where: "Projects line 31" },
      { term: "Bug reports", count: 1, where: "Experience line 28" },
      { term: "Process documentation", count: 2, where: "Projects line 33" }
    ]}
  ],

  listings: [
    {
      id: "J01", title: "Junior Frontend Developer", company: "Northwind Canvas (synthetic)",
      score: 55, reason: "Shares JavaScript, React, TypeScript, HTML, CSS, Jest, Git, Accessibility, Figma.",
      matched: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Jest", "Git", "Accessibility", "Figma"],
      missing: [],
      requirements: [
        { id: "J01-R1", text: "Build interfaces in React", term: "React", must: true, evidence: "Experience line 20" },
        { id: "J01-R2", text: "Write TypeScript, not only plain JavaScript", term: "TypeScript", must: true, evidence: "Skills line 16 (marked basic)" },
        { id: "J01-R3", text: "Work from design files in Figma", term: "Figma", must: false, evidence: "Experience line 27" },
        { id: "J01-R4", text: "Add automated tests to components", term: "Jest", must: false, evidence: "Experience line 23" },
        { id: "J01-R5", text: "Prototype a flow before building it", term: "Prototyping", must: false, evidence: null }
      ]
    },
    {
      id: "J03", title: "Frontend Engineer", company: "Example Labs (synthetic)",
      score: 48, reason: "Shares React, TypeScript, Webpack, Performance, Jest, Accessibility, Git, JavaScript.",
      matched: ["React", "TypeScript", "Webpack", "Performance", "Jest", "Accessibility", "Git", "JavaScript"],
      missing: [],
      requirements: [
        { id: "J03-R1", text: "Ship shared components in React and TypeScript", term: "TypeScript", must: true, evidence: "Skills line 16" },
        { id: "J03-R2", text: "Improve page load performance", term: "Performance", must: true, evidence: "Summary line 12" },
        { id: "J03-R3", text: "Configure a bundler", term: "Webpack", must: false, evidence: "Skills line 16" },
        { id: "J03-R4", text: "Review other people's pull requests", term: "Git", must: false, evidence: "Skills line 16" }
      ]
    },
    {
      id: "J09", title: "Product Design Intern", company: "Fold Studio (synthetic)",
      score: 25, reason: "Shares Figma, Design systems, Accessibility. No evidence yet for Prototyping, User research.",
      matched: ["Figma", "Design systems", "Accessibility"],
      missing: ["Prototyping", "User research"],
      requirements: [
        { id: "J09-R1", text: "Produce screens and flows in Figma", term: "Figma", must: true, evidence: "Experience line 27" },
        { id: "J09-R2", text: "Build clickable prototypes", term: "Prototyping", must: true, evidence: null },
        { id: "J09-R3", text: "Sit in on usability sessions", term: "User research", must: false, evidence: null },
        { id: "J09-R4", text: "Respect an existing design system", term: "Design systems", must: false, evidence: "Projects line 31" }
      ]
    },
    {
      id: "J05", title: "Backend Developer", company: "Harborline Systems (synthetic)",
      score: 21, reason: "Shares REST APIs, Python. No evidence yet for SQL, Docker, Testing.",
      matched: ["REST APIs", "Python"],
      missing: ["SQL", "Docker", "Testing"],
      requirements: [
        { id: "J05-R1", text: "Design and maintain REST APIs", term: "REST APIs", must: true, evidence: "Skills line 16" },
        { id: "J05-R2", text: "Work with PostgreSQL or another relational database", term: "SQL", must: true, evidence: null },
        { id: "J05-R3", text: "Package services with Docker", term: "Docker", must: true, evidence: null },
        { id: "J05-R4", text: "Write Python services", term: "Python", must: false, evidence: "not present" }
      ]
    },
    {
      id: "J06", title: "QA Analyst", company: "Papertrail Software (synthetic)",
      score: 15, reason: "Shares Jest, Testing, Git. No evidence yet for Test cases, Regression testing, Bug reports, SQL, Jira.",
      matched: ["Jest", "Testing", "Git"],
      missing: ["Test cases", "Regression testing", "Bug reports", "SQL", "Jira"],
      requirements: [
        { id: "J06-R1", text: "Write and maintain test cases", term: "Test cases", must: true, evidence: null },
        { id: "J06-R2", text: "File reproducible bug reports", term: "Bug reports", must: true, evidence: "Experience line 28" },
        { id: "J06-R3", text: "Track work in Jira", term: "Jira", must: false, evidence: null },
        { id: "J06-R4", text: "Check data with SQL", term: "SQL", must: false, evidence: null }
      ]
    },
    {
      id: "J02", title: "Data Analyst", company: "Meridian Retail Group (synthetic)",
      score: 12, reason: "Shares none of its core terms. It asks for SQL, Excel, Tableau.",
      matched: [],
      missing: ["SQL", "Excel", "Tableau", "Data cleaning", "Python", "Dashboards", "Analytics"],
      requirements: [
        { id: "J02-R1", text: "Write SQL against a warehouse", term: "SQL", must: true, evidence: null },
        { id: "J02-R2", text: "Maintain dashboards other people depend on", term: "Dashboards", must: true, evidence: null },
        { id: "J02-R3", text: "Clean messy source data", term: "Data cleaning", must: false, evidence: null }
      ]
    }
  ],

  /* The change ledger for listing J01. Four proposals, all undecided until the person acts.
     `sectionKey` is what the compare view matches on, so renaming a section on screen 02
     cannot make an accepted change disappear from the result. */
  changes: [
    {
      id: "C01", kind: "label", location: "Experience, line 21",
      section: "Experience", sectionKey: "experience",
      before: "- Added keyboard navigation and focus states to the account settings screens",
      after: "- Accessibility — added keyboard navigation and focus states to the account settings screens",
      reason: "The listing asks for Accessibility. This bullet already describes it ('keyboard navigation'), so the label names it. Nothing is added to what happened.",
      span: "Experience lines 21–21"
    },
    {
      id: "C02", kind: "surface", location: "Experience, current role",
      section: "Experience", sectionKey: "experience",
      before: "- Rebuilt the checkout form in React, reducing validation errors reported by support\n- Added keyboard navigation and focus states to the account settings screens\n- Cut initial bundle size by splitting routes and removing unused imports\n- Wrote component tests in Jest for the pricing calculator",
      after: "- Rebuilt the checkout form in React, reducing validation errors reported by support\n- Added keyboard navigation and focus states to the account settings screens\n- Wrote component tests in Jest for the pricing calculator\n- Cut initial bundle size by splitting routes and removing unused imports",
      reason: "This role's bullets that evidence Accessibility, Jest, React move up; the bullet with no match to the listing moves down. All 4 bullets stay, and nothing moves between employers.",
      span: "Experience lines 20–23"
    },
    {
      id: "C03", kind: "rebuild_summary", location: "Summary, lines 11–13",
      section: "Summary", sectionKey: "summary",
      before: "Frontend developer with two years of experience building web interfaces in JavaScript and React.\nComfortable translating design files into accessible components and improving page performance.\nLooking for a product team where I can own small features end to end.",
      after: "Frontend developer with two years of experience building web interfaces in JavaScript and React. Comfortable translating design files into accessible components and improving page performance.",
      reason: "2 of 3 existing summary sentences mention this listing's terms. The summary keeps those and drops the rest. No new sentence is written.",
      span: "Summary lines 11–13"
    },
    {
      id: "C04", kind: "drop_qualifier", location: "Skills, line 16",
      section: "Skills", sectionKey: "skills",
      before: "JavaScript, React, HTML, CSS, TypeScript (basic), Jest, Git, Figma, REST APIs, Webpack",
      after: "JavaScript, React, HTML, CSS, TypeScript, Jest, Git, Figma, REST APIs, Webpack",
      reason: "PLANTED FOR THE DEMO, and deliberately not one of the notebook's five kinds. It removes the honest qualifier '(basic)' from TypeScript. The integrity test compares tokens, so a deleted word leaves nothing new to catch. Reject it.",
      span: "Skills line 16",
      planted: true
    }
  ],

  stages: {
    parse: ["Reading file…", "Detecting sections…", "Extracting terms…", "Ranking listings…"],
    tailor: ["Reading the listing's requirements…", "Comparing each line for shared terms…",
             "Proposing changes…", "Checking every proposal against the source…"]
  },

  devStates: {
    "01": { processing: "Parsing resume_strong.md — stage 2 of 4: detecting sections.",
            success: "Sections detected. Nothing has been matched yet.",
            failed: "The file could not be read. It is a scanned PDF with no selectable text.",
            cancelled: "Parsing stopped at your request. The file was not kept." },
    "02": { processing: "Re-checking the Projects section against the heading lexicon.",
            success: "Section correction saved.", failed: "That name is already used by another section.",
            cancelled: "Rename cancelled. The section keeps its old name." },
    "03": { processing: "Re-counting terms after your edit.", success: "Term added by you.",
            failed: "That term is already in the list.", cancelled: "Term edit cancelled." },
    "04": { processing: "Ranking 12 listings against the current term set.", success: "Matches updated.",
            failed: "Ranking failed because no terms are left. Add at least one term.",
            cancelled: "Ranking cancelled. The previous results are still shown." },
    "05": { processing: "Checking requirements against evidence.", success: "Every gap has a decision.",
            failed: "One requirement has no decision yet, so the review cannot start.",
            cancelled: "Requirement check cancelled." },
    "06": { processing: "Generating proposals. The duration is not known in advance.",
            success: "4 proposals ready for review.", failed: "A proposal failed its check and was withdrawn.",
            cancelled: "Generation stopped. No proposals were kept." },
    "07": { processing: "Building the export file in this browser.",
            success: "Downloaded to your device. Nothing was sent anywhere.",
            failed: "The browser blocked the download. Allow downloads for this page, then try again.",
            cancelled: "Export cancelled. Nothing was written." },
    "08": { processing: "Switching state for the demo panel.", success: "State shown.",
            failed: "This state is not defined for that screen.", cancelled: "State cleared." }
  }
};
