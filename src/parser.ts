import { uniqBy } from "lodash";
import { readdirSync, writeFileSync } from "fs";
import dayjs from "dayjs";
const converter = require("json-2-csv");

const YEARS = [2019, 2020, 2023];

type Tournament = {
  id: number;
  name: string;
  slug: string;
  createdAt: number | string;
  endAt: number | string;
  isOnline: boolean;
  city: null | string;
  countryCode: null | string;
};

function loadYearData(year: number) {
  const yearData: Tournament[] = [];
  const dir = getYearDir(year);
  const files = readdirSync(dir);
  files.forEach((file) => {
    const data = require(`${dir}/${file}`);
    yearData.push(...(data.tournaments.nodes as Tournament[]));
  });
  return yearData;
}

function getYearDir(year: number) {
  return `${__dirname}/data/${year}`;
}

function formatData(data: Tournament[]) {
  const parsedData: Tournament[] = [];
  data.forEach((data) => {
    parsedData.push({
      ...data,
      createdAt: dayjs
        .unix(data.createdAt as number)
        .format("YYYY-MM-DDTHH:mm:ss"),
      endAt: dayjs.unix(data.endAt as number).format("YYYY-MM-DDTHH:mm:ss"),
    });
  });
  return parsedData;
}

async function main() {
  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    const data = loadYearData(year);
    const uniqById = uniqBy(data, "id");
    const formatted = formatData(uniqById);
    const csv = await converter.json2csv(formatted);
    writeFileSync(`${__dirname}/data/csv/${year}.csv`, csv);
  }
}

main();
