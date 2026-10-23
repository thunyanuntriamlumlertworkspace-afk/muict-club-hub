export const CLUB_CAPACITY = 35;

export type Club = {
  slug: string;
  name: string;
  tag: string;
  short: string;
  about: string;
  meets: string;
  location: string;
  members: number;
  founded: number;
  president: string;
  activities: string[];
};

export const clubs: Club[] = [
  {
    slug: "ai",
    name: "AI",
    tag: "Tech",
    short: "Machine learning, LLMs, and intelligent systems.",
    about:
      "The AI Club brings together students who build with machine learning and large language models. Members share papers, run experiments together, and ship small AI projects each semester.",
    meets: "Every Wednesday, 17:00",
    location: "Room 301, Building A",
    members: 120,
    founded: 2019,
    president: "K. Somchai",
    activities: [
      "Weekly paper reading group",
      "Hands-on workshops with LLMs and Python",
      "Semester hackathon and demo day",
    ],
  },
  {
    slug: "dev",
    name: "Dev",
    tag: "Tech",
    short: "Build web, mobile, and open-source projects together.",
    about:
      "The Dev Club is a hands-on software community. Members work on real web and mobile projects, contribute to open source, and review each other's code in weekly build sessions.",
    meets: "Every Thursday, 18:00",
    location: "Room 205, Building A",
    members: 180,
    founded: 2017,
    president: "K. Napat",
    activities: [
      "Team-based web and mobile builds",
      "Open-source contribution nights",
      "Code review and pair programming",
    ],
  },
  {
    slug: "iot",
    name: "IoT",
    tag: "Tech",
    short: "Sensors, microcontrollers, and connected devices.",
    about:
      "The IoT Club explores the physical side of computing. Members wire sensors, program microcontrollers, and connect devices to dashboards in a shared hardware lab.",
    meets: "Every Friday, 13:00",
    location: "Hardware Lab, Building B",
    members: 75,
    founded: 2020,
    president: "K. Anong",
    activities: [
      "Microcontroller and sensor basics",
      "Connected device builds",
      "Smart campus mini-projects",
    ],
  },
  {
    slug: "cyber",
    name: "Cyber",
    tag: "Tech",
    short: "Security, CTF challenges, and ethical hacking.",
    about:
      "The Cyber Club teaches practical security skills. Members solve capture-the-flag challenges, learn ethical hacking fundamentals, and compete in national CTF events as a team.",
    meets: "Every Saturday, 09:00",
    location: "Room 402, Building A",
    members: 90,
    founded: 2018,
    president: "K. Thiti",
    activities: [
      "Weekly CTF practice range",
      "Ethical hacking fundamentals",
      "Team entries to national competitions",
    ],
  },
  {
    slug: "badminton",
    name: "Badminton",
    tag: "Sports",
    short: "Weekly practice and friendly tournaments.",
    about:
      "The Badminton Club keeps courts open for casual play, coached practice, and friendly matches. Beginners are welcome and can borrow rackets at the hall.",
    meets: "Every Tuesday, 19:00",
    location: "Sports Hall",
    members: 150,
    founded: 2015,
    president: "K. Wicha",
    activities: [
      "Coached practice sessions",
      "Monthly friendly tournaments",
      "Inter-faculty league",
    ],
  },
  {
    slug: "table-tennis",
    name: "Table Tennis",
    tag: "Sports",
    short: "Fast rallies, casual games, and competitions.",
    about:
      "The Table Tennis Club runs open tables for quick games and organized practice. Members also host an internal ladder and an end-of-year competition.",
    meets: "Every Monday, 18:00",
    location: "Sports Hall, Table Area",
    members: 60,
    founded: 2016,
    president: "K. Pim",
    activities: [
      "Open table sessions",
      "Internal ranking ladder",
      "End-of-year competition",
    ],
  },
  {
    slug: "japanese-society",
    name: "Japanese Society",
    tag: "Culture",
    short: "Language, anime, food, and Japanese culture.",
    about:
      "The Japanese Society celebrates Japanese language and culture through casual meetups, conversation practice, film nights, and food events.",
    meets: "Every Wednesday, 18:30",
    location: "Room 108, Building C",
    members: 110,
    founded: 2014,
    president: "K. Mint",
    activities: [
      "Japanese conversation practice",
      "Film and anime nights",
      "Cultural food events",
    ],
  },
  {
    slug: "board-game",
    name: "Board Game",
    tag: "Leisure",
    short: "Strategy, party, and tabletop game nights.",
    about:
      "The Board Game Club hosts game nights with a library of strategy, party, and card games. New players get a short rules walkthrough before every session.",
    meets: "Every Sunday, 17:00",
    location: "Student Lounge",
    members: 130,
    founded: 2016,
    president: "K. Bank",
    activities: [
      "Weekly open game nights",
      "Strategy and party game library",
      "Game design mini-workshops",
    ],
  },
  {
    slug: "media-and-entertainment",
    name: "Media and Entertainment",
    tag: "Creative",
    short: "Photo, video, and event production.",
    about:
      "The Media and Entertainment Club covers photography, video, and live event production. Members shoot and edit for campus events and build a shared portfolio.",
    meets: "Every Thursday, 17:00",
    location: "Media Studio, Building D",
    members: 95,
    founded: 2018,
    president: "K. Beam",
    activities: [
      "Photography and video shoots",
      "Editing and post-production",
      "Live coverage of campus events",
    ],
  },
  {
    slug: "speakers",
    name: "Speakers",
    tag: "Skills",
    short: "Public speaking, debate, and presentation.",
    about:
      "The Speakers Club helps members speak with confidence. Weekly sessions mix short speeches, structured debate, and friendly feedback in a supportive setting.",
    meets: "Every Tuesday, 12:00",
    location: "Room 101, Building A",
    members: 70,
    founded: 2019,
    president: "K. Earn",
    activities: [
      "Weekly speech practice",
      "Structured debates",
      "Presentation skills clinics",
    ],
  },
];

export function getClub(slug: string) {
  return clubs.find((c) => c.slug === slug);
}
