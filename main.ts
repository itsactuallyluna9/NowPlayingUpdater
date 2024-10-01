import {
  brightCyan,
  brightRed,
} from "https://deno.land/std@0.224.0/fmt/colors.ts";

console.log("Now Playing Updater v0.0.3");
console.log(
  "For Bean, Made with" + brightRed(" <3 ") + "by" + brightCyan(" Luna"),
);
console.log("Now starting...");

let previousISRC = "";
let errors = 0;

function getCurrentShowName() {
  const now = new Date();
  const day = now.getDay();
  if (day === 1) {
    // Monday
    return "(hello!)" // luna's show :3
  } else if (day === 2) {
    // Tuesday
    return "Hour of Chaos - Bean" // bean's show
  } else {
    console.log("Talk to Luna if you're also using this! I'll add your show here!");
    return "(api error, sorry!)" // return a "api error" so that people think it's just us.
  }
}

async function updateNowPlaying() {
  try {
    const res = await fetch("http://localhost:10769/currentPlayingSong");
    const data = (await res.json()).info;
    errors = 0;
    if (data.isrc === previousISRC) {
      if (data.remainingTime < 10_000) { // 10 seconds
        setTimeout(updateNowPlaying, data.remainingTime + 500);
      }
      return;
    }
    previousISRC = data.isrc;
    if (data.name === undefined || data.artistName === undefined) {
      console.log("Failed to get song info, but health is ok! (is nothing playing currently?)")
      console.log("Providing a default message...");
      await Deno.writeFile("now_playing.txt", new TextEncoder().encode(getCurrentShowName()));
      return;
    }
    await Deno.writeFile(
      "now_playing.txt",
      new TextEncoder().encode(data.name + " - " + data.artistName),
    );
    console.log(
      "Updated now playing to " + data.name + " - " + data.artistName,
    );
  } catch (e) {
    if (errors > 5) {
      console.error("Too many errors, exiting...");
      Deno.exit(1);
    }
    if (e instanceof SyntaxError) {
      console.error("Failed to get song info, but health appears to be ok! (is nothing playing currently?)")
      console.info("Providing a default message...");
      await Deno.writeFile("now_playing.txt", new TextEncoder().encode(getCurrentShowName()));
      errors++;
      return;
    }
    console.error("Failed to update! Retrying in 10 seconds...");
    await Deno.writeFile("now_playing.txt", new TextEncoder().encode(getCurrentShowName()));
    errors++;
  }
}

setInterval(updateNowPlaying, 10_000);
updateNowPlaying();
