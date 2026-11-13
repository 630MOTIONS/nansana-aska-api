// SAMPLE DATA FOR DEVELOPMENT ONLY. These clubs, fixtures and scores were
// copied from the website's Stitch designs and are not confirmed with the
// club or FAU. Never run this against a real database.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to load sample data in production.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

// Kick-off times are Uganda time (UTC+3). Finished matches have no time in the
// sample data, so they default to 19:00.
const kickoff = (date: string, time = '19:00') =>
  new Date(`${date}T${time}:00+03:00`);

const teams = [
  { slug: 'nansana-aska', name: 'Nansana ASKA', squad: 'men', isOurs: true },
  { slug: 'park-fc', name: 'Park FC', squad: 'men', isOurs: false },
  { slug: 'mengo-city', name: 'Mengo City', squad: 'men', isOurs: false },
  { slug: 'kisenyi-fc', name: 'Kisenyi FC', squad: 'men', isOurs: false },
  {
    slug: 'kabowa-dream-team',
    name: 'Kabowa Dream Team',
    squad: 'men',
    isOurs: false,
  },
  {
    slug: 'nansana-aska-w',
    name: 'Nansana ASKA W',
    squad: 'women',
    isOurs: true,
  },
  {
    slug: 'kampala-junior-ladies',
    name: 'Kampala Junior Ladies',
    squad: 'women',
    isOurs: false,
  },
  {
    slug: 'kisenyi-queens',
    name: 'Kisenyi Queens',
    squad: 'women',
    isOurs: false,
  },
] as const;

const competitions = [
  {
    slug: 'fsl-sample',
    name: 'FAU Futsal Super League',
    season: 'Sample season',
    squad: 'men',
    teams: [
      'nansana-aska',
      'park-fc',
      'mengo-city',
      'kisenyi-fc',
      'kabowa-dream-team',
    ],
  },
  {
    slug: 'womens-super-league-sample',
    name: 'FAU Women’s Super League',
    season: 'Sample season',
    squad: 'women',
    teams: ['nansana-aska-w', 'kisenyi-queens'],
  },
  {
    slug: 'womens-cup-sample',
    name: 'FAU Women’s Cup',
    season: 'Sample season',
    squad: 'women',
    teams: ['nansana-aska-w', 'kampala-junior-ladies'],
  },
] as const;

type SampleMatch = {
  slug: string;
  competition: string;
  stage: string;
  matchday?: number;
  at: Date;
  venue: string | null;
  home: string;
  away: string;
  score?: [number, number];
};

const matches: SampleMatch[] = [
  {
    slug: 'md14-park-fc',
    competition: 'fsl-sample',
    stage: 'Matchday 14',
    matchday: 14,
    at: kickoff('2026-11-07', '19:30'),
    venue: 'Old Kampala Arena',
    home: 'nansana-aska',
    away: 'park-fc',
  },
  {
    slug: 'md15-mengo-city',
    competition: 'fsl-sample',
    stage: 'Matchday 15',
    matchday: 15,
    at: kickoff('2026-11-15', '18:00'),
    venue: 'Old Kampala Arena',
    home: 'nansana-aska',
    away: 'mengo-city',
  },
  {
    slug: 'womens-cup-quarter-final',
    competition: 'womens-cup-sample',
    stage: 'Cup quarter-final',
    at: kickoff('2026-11-16', '15:30'),
    venue: 'Lugogo Indoor Arena',
    home: 'nansana-aska-w',
    away: 'kampala-junior-ladies',
  },
  {
    slug: 'md16-kisenyi-fc',
    competition: 'fsl-sample',
    stage: 'Matchday 16',
    matchday: 16,
    at: kickoff('2026-11-22', '20:00'),
    venue: null,
    home: 'kisenyi-fc',
    away: 'nansana-aska',
  },
  {
    slug: 'round8-park-fc',
    competition: 'fsl-sample',
    stage: 'Round 8',
    matchday: 8,
    at: kickoff('2026-10-24'),
    venue: 'Old Kampala Arena',
    home: 'nansana-aska',
    away: 'park-fc',
    score: [4, 3],
  },
  {
    slug: 'round7-mengo-city',
    competition: 'fsl-sample',
    stage: 'Round 7',
    matchday: 7,
    at: kickoff('2026-10-18'),
    venue: 'Old Kampala Arena',
    home: 'nansana-aska',
    away: 'mengo-city',
    score: [5, 3],
  },
  {
    slug: 'round5-kisenyi-queens',
    competition: 'womens-super-league-sample',
    stage: 'Round 5',
    matchday: 5,
    at: kickoff('2026-10-12'),
    venue: 'Old Kampala Arena',
    home: 'nansana-aska-w',
    away: 'kisenyi-queens',
    score: [3, 1],
  },
  {
    slug: 'round6-kabowa',
    competition: 'fsl-sample',
    stage: 'Round 6',
    matchday: 6,
    at: kickoff('2026-10-05'),
    venue: 'Lugogo Arena',
    home: 'kabowa-dream-team',
    away: 'nansana-aska',
    score: [2, 4],
  },
];

async function main() {
  for (const team of teams) {
    await prisma.team.upsert({
      where: { slug: team.slug },
      update: {},
      create: team,
    });
  }

  for (const competition of competitions) {
    const created = await prisma.competition.upsert({
      where: { slug: competition.slug },
      update: {},
      create: {
        slug: competition.slug,
        name: competition.name,
        season: competition.season,
        squad: competition.squad,
      },
    });

    for (const teamSlug of competition.teams) {
      const team = await prisma.team.findUniqueOrThrow({
        where: { slug: teamSlug },
      });
      await prisma.competitionTeam.upsert({
        where: {
          competitionId_teamId: { competitionId: created.id, teamId: team.id },
        },
        update: {},
        create: { competitionId: created.id, teamId: team.id },
      });
    }
  }

  for (const match of matches) {
    const competition = await prisma.competition.findUniqueOrThrow({
      where: { slug: match.competition },
    });
    const home = await prisma.team.findUniqueOrThrow({
      where: { slug: match.home },
    });
    const away = await prisma.team.findUniqueOrThrow({
      where: { slug: match.away },
    });

    await prisma.match.upsert({
      where: { slug: match.slug },
      update: {},
      create: {
        slug: match.slug,
        competitionId: competition.id,
        stage: match.stage,
        matchday: match.matchday,
        kickoffAt: match.at,
        venue: match.venue,
        homeTeamId: home.id,
        awayTeamId: away.id,
        status: match.score ? 'final' : 'scheduled',
        homeScore: match.score?.[0],
        awayScore: match.score?.[1],
      },
    });
  }

  console.log('Sample data loaded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
