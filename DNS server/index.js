import fs from "fs";
import readline from "readline";

export const processBindFile = async (filePath) => {};

// this line of code gets the file
const fileStream = fs.createReadStream(filePath);

// reads the file line by line
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let origin;
let ttl;
let previousTtl;
let previousName;

let records = [];

let recordsType = ["NS", "A", "CNAME", "MX"];

recordsType.forEach((el) => {
  records[el] = [];
});

let soa = {};
let soaLine = 0;
let multiLineSoa = false;
let containsTls = false;

for await (const line of rl) {
  if (line.length > 1) {
    // do something
  }
}

let commentedLine = false;
let i = line.trim().replace(/\t/g, " ").replace(/\s+/g, " ");

let commentIndex = i.indexof(";");

// if the index is not -1 it means there is a comment on the zone file
if (commentIndex != -1) {
  // if the length is not zero it means there are multiple comments
  if (commentIndex != 0) {
    let m = i.split(";");
    i = m[0];
  } else {
    commentedLine = true;
  }
}

if (!commentedLine) {
  let splittedLine = i.split(" ");
  // check if the first word is origin set it to the first line
  switch (splittedLine[0]) {
    case "$ORIGIN":
      origin = splittedLine[1];
      break;

    case "$TTL":
      ttl = splittedLine[1];
      break;

    case "$INCLUDE":
      break;

    default:
      if (splittedLine.includes("SOA")) {
        previousName = splittedLine[0];
        soa.mname = splittedLine[3];
        soa.rname = splittedLine[4];

        if (splittedLine.includes(")")) {
          soa.serial = splittedLine[6];
          soa.refresh = splittedLine[7];
          soa.retry = splittedLine[8];
          soa.expire = splittedLine[9];
          soa.title = splittedLine[10];
        } else {
          multiLineSoa = true;
          soaLine++;
        }
      }
  }
}

if (multiLineSoa) {
  switch (soaLine) {
    case 2:
      // console.log(splittedLine);
      soa.serial = splittedLine[0];
      break;
    case 3:
      soa.refresh = splittedLine[0];
      break;
    case 4:
      soa.retry = splittedLine[0];
      break;
    case 5:
      soa.expire = splittedLine[0];
      break;
    case 6:
      soa.ttl = splittedLine[0];
      break;
    default:
      break;
  }
  // console.log(splittedLine);
  if (splittedLine.includes(")")) {
    multiLineSoa = false;
  }
  soaLine++;
}

recordsType.forEach((element) => {
  if (splittedLine.includes(element)) {
    let type = element;

    let rr;
    [rr, previousName, previousTtl] = processRr(
      splittedLine,
      containsTtl,
      previousTtl,
      previousName,
      origin,
      ttl
    );
    records[type].push(rr);
  }
});

function processRr(
  splittedLine,
  containsTtl,
  previousTtl,
  previousName,
  origin,
  ttl
) {
  let rr = {};

  let totalLength = splittedLine.length;

  let isMx = Number(splittedLine[totalLength - 2]);

  switch (totalLength) {
    case 5:
      for (let index = 0; index < totalLength; index++) {
        const element = splittedLine[index];
        if (!element.includes(".")) {
          if (parseInt(element)) {
            if (!isMx) {
              containsTtl = true;
              previousTtl = element;
              splittedLine.splice(index, 1);
            }
            break;
          }
        }
      }

      if (!isMx) {
        previousName = splittedLine[0];
        rr.class = splittedLine[1];
        rr.type = splittedLine[2];
        rr.data = splittedLine[3];
      }

      break;
    case 4:
      for (let index = 0; index < totalLength; index++) {
        const element = splittedLine[index];
        if (!element.includes(".")) {
          if (parseInt(element)) {
            if (!isMx) {
              containsTtl = true;
              previousTtl = element;
              splittedLine.splice(index, 1);
            }
            break;
          }
        }
      }

      if (containsTtl) {
        //Name is missing
        rr.class = splittedLine[0];
        rr.type = splittedLine[1];
        rr.data = splittedLine[2];
      } else {
        if (isMx) {
          previousName = "@";
          rr.class = splittedLine[0];
          rr.type = splittedLine[1];
          rr.preference = splittedLine[2];
          rr.data = splittedLine[3];
        } else {
          previousName = splittedLine[0];
          rr.class = splittedLine[1];
          rr.type = splittedLine[2];
          rr.data = splittedLine[3];
        }
      }

      break;
    case 3:
      rr.class = splittedLine[0];
      rr.type = splittedLine[1];
      rr.data = splittedLine[2];

      break;
    case 2:
      break;
    default:
      break;
  }
  rr.name = previousName || origin;
  rr.ttl = previousTtl || ttl;

  return [rr, previousName, previousTtl];
}
