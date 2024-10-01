import {
  brightCyan,
  brightRed,
} from "https://deno.land/std@0.224.0/fmt/colors.ts";

console.log("Now Playing Updater v0.1.0-git");
console.log(
  "Made with" + brightRed(" <3 ") + "by" + brightCyan(" Luna"),
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

async function updateNowPlayingNeo() {
  try {
    const res = await fetch("http://localhost:10767/api/v1/playback/now-playing", {
      headers: {
        'apptoken': 'lunaiscool'
      }
    });
    const data = await res.json();
    if (data.error && data.error === "Unauthorized") {
      console.log("Unauthorized! To fix this, create a new token and replace it with 'lunaiscool'. (A proper way to do this is coming soon!)")
      console.log("You may need to restart Cider afterwords.")
      return;
    }
    if (data.info.error && data.info.error === "Timeout exceeded") {
      console.log("Timeout exceeded! This is likely a bug in Cider, trying again!")
      setTimeout(updateNowPlayingNeo, 1000);
      return;
    }
    errors = 0;
    if (data.info.isrc === previousISRC) {
      if (data.info.remainingTime < 10) { // 10 seconds
        setTimeout(updateNowPlayingNeo, (data.info.remainingTime * 1000) + 500);
      }
      return;
    }
    previousISRC = data.info.isrc;
    if (data.info.name === undefined || data.info.artistName === undefined) {
      console.log("Failed to get song info, but health is ok! (is nothing playing currently?)")
      console.log("Providing a default message...");
      await Deno.writeFile("now_playing.txt", new TextEncoder().encode(getCurrentShowName()));
      return;
    }
    await Deno.writeFile(
      "now_playing.txt",
      new TextEncoder().encode(data.info.name + " - " + data.info.artistName),
    );
    console.log(
      "Updated now playing to " + data.info.name + " - " + data.info.artistName,
    );
  }
  catch (e) {
    console.log(e)
    if (errors > 5) {
      console.error("Too many errors, exiting...");
      Deno.exit(1);
    }
    console.error("Failed to update! Retrying in 10 seconds...");
    await Deno.writeFile("now_playing.txt", new TextEncoder().encode(getCurrentShowName()));
    errors++;
    return;
  }
}

async function updateNowPlayingOld() {
  try {
    const res = await fetch("http://localhost:10769/currentPlayingSong");
    const data = (await res.json()).info;
    errors = 0;
    if (data.isrc === previousISRC) {
      if (data.remainingTime < 10_000) { // 10 seconds
        setTimeout(updateNowPlayingOld, data.remainingTime + 500);
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

async function boot() {
  // wait until either of the two servers are up
  let attempts = 0;
  let updateNowPlaying: () => Promise<void>;
  while (true) {
    try {
      const res = await fetch("http://localhost:10767/api/v1/playback/active")
      if (res.status === 200 || res.status === 403) {
        console.log("Using new API.");
        updateNowPlaying = updateNowPlayingNeo;
        break;
      }
    } catch (_e) {
      // ignore
    }
    try {
      const res2 = await fetch("http://localhost:10769/currentPlayingSong");
      if (res2.status === 200) {
        console.log("Using old API.");
        updateNowPlaying = updateNowPlayingOld;
        break;
      }
    } catch (_e) {
      // ignore
    }
    attempts++;
    if (attempts > 10) {
      console.error("Failed to connect to either API! Exiting...");
      Deno.exit(1);
    }
    console.log("Waiting on Cider...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  await updateNowPlaying()
  setInterval(updateNowPlaying, 10_000);
}

await boot();
