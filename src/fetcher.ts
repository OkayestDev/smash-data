import { request, gql } from "graphql-request";
import dayjs from "dayjs";
import fs from "fs";

const YEARS = [2020, 2023];

const URL = "https://api.start.gg/gql/alpha";

const AUTHORIZATION = "" // @todo add key "";

const SMASH_ID = 1386;

function sleep(timeMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}


function getWeeksInYear(year: number) {
  const weeks: { start: number; end: number }[] = [];
  let currentWeekStart = dayjs(`${year}-01-01`);

  console.info({ date: currentWeekStart.format("YYYY-MM-DD") });

  while (currentWeekStart.year() === year) {
    const currentWeekEnd = currentWeekStart.endOf("week");
    weeks.push({
      start: currentWeekStart.unix(),
      end: currentWeekEnd.unix(),
    });
    currentWeekStart = currentWeekStart.add(1, "week");
  }

  return weeks;
}

function createDoc(page: number, startDate: number, endDate: number) {
  return gql`
    query TournamentsByVideogame($videogameId: ID!) {
      tournaments(
        query: {
          perPage: 500
          page: ${page}
          filter: {
            afterDate: ${startDate}
            beforeDate: ${endDate}
            videogameIds: [$videogameId]
          }
        }
      ) {
        nodes {
          id
          name
          slug
          createdAt
          endAt
          isOnline
          city
          countryCode
        }
      }
    }
  `;
}

async function main() {
  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    console.info(`Start ${year}`);
    const weeks = getWeeksInYear(year);

    console.info(weeks.length);

    let docCounterForYear = 1;

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
      const { start, end } = weeks[weekIndex];
      let page = 1;
      while (true) {
        console.info(
          `Doc count: ${docCounterForYear}. Fetching page ${page} for week ${weekIndex}. Start, end ${start}, ${end}`
        );
        const document = createDoc(page, start, end);
        const res = await request({
          url: URL,
          document,
          variables: {
            videogameId: SMASH_ID,
          },
          requestHeaders: {
            Authorization: `Bearer ${AUTHORIZATION}`,
          },
        });
        fs.writeFileSync(
          `${getYearDir(year)}/${docCounterForYear}.json`,
          JSON.stringify(res, null, 4)
        );

        docCounterForYear++;
        await sleep(60000);

        // @ts-ignore
        if (res.tournaments.nodes.length < 500) {
          // @ts-ignore
          console.info({ length: res.tournaments.nodes.length });
          break;
        }
        page++;
      }
    }
  }
}

main();
