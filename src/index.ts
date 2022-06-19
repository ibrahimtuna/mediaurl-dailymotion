import { createAddon, MovieItem, runCli } from "@mediaurl/sdk";
import { fetchHomePage, fetchVideo } from "./scraper";

const exampleAddon = createAddon({
  id: "dailyMotionCom",
  name: "dailymotion.com",
  version: "0.0.1",
  // Trigger this addon on this kind of items
  itemTypes: ["movie", "series"],
  triggers: [
    // Trigger this addon when an item has a `name` field
    "name",
    // or trigger it when an item has a `ids.imdb_id` field
    "imdb_id",
  ],
});

const items: MovieItem[] = [];

exampleAddon.registerActionHandler("catalog", async (input, ctx) => {
  // Here should be your website parser script, or an API call to a website to list available items
  let hrefs = await fetchHomePage();
  hrefs.map((item, i) => {
    let searchForDublicate = items.find((e) => e.name === item.name);
    if (!searchForDublicate) {
      items.push({
        type: "movie",
        ids: {
          imdb_id: i.toString(),
        },
        name: item.name,
        images: item.images,
        link: item.link,
      });
    }
  });

  return {
    // We don't use pagination, so set `nextCursor` to `null`.
    nextCursor: null,
    items,
  };
});

exampleAddon.registerActionHandler("item", async (input, ctx) => {
  // IMDB example
  if (
    input.type === "movie" &&
    input.ids.imdb_id &&
    input.ids.imdb_id === "tt0807840"
  ) {
    // Here you can use the imdb field to find this movie on a website to grab it's metadata.
    // For example from IMDB directly: `await fetch("https://www.imdb.com/title/tt0807840");`
    // In this example we use a static return value.

    // Return the data of "Elephants Dream" like in the `directory` handler, but with some more infos:
    return <MovieItem>{
      type: "movie",
      ids: { imdb_id: "tt0807840" },
      name: "Elephants Dream",
      images: {
        poster:
          "https://m.media-amazon.com/images/M/MV5BNmMxYTE3MjctYTczYy00NjM3LWJiMDgtMzExMjZkYWU3NWRmXkEyXkFqcGdeQXVyMjgwMjk0NzA@._V1_SY999_CR0,0,706,999_AL_.jpg",
      },
      description:
        'This is a good example item where we will show how to use the "source", "subtitle" and "resolve" handler',
      director: ["Bassam Kurdali"],
    };
  }

  // Nothing found by IMDB ID. So let's try to find it by name.

  // In a real-world addon you would likely use the search function of a website to find this item.
  // Let's pretend this is a search:
  const query = input.name.toLocaleLowerCase();
  if (
    query.includes("big") &&
    query.includes("buck") &&
    query.includes("bunny")
  ) {
    return <MovieItem>{
      type: "movie",
      ids: { some: "id" },
      name: "Big Buck Bunny",
      year: 2013,
      images: {
        poster:
          "https://en.wikipedia.org/wiki/Big_Buck_Bunny#/media/File:Big_buck_bunny_poster_big.jpg",
      },
      description:
        "Big Buck Bunny (code-named Project Peach) is a 2008 short computer-animated comedy film featuring animals of the forest, made by the Blender Institute, part of the Blender Foundation.",
    };
  }

  // The item was not found, so let's just return `null`
  return null;
});

exampleAddon.registerActionHandler("source", async (input, ctx) => {
  let findItem = items.find((item) => item.name === input.name);
  if (findItem) {
    console.log(findItem, "item found");
    let video = await fetchVideo(findItem.link);
    return {
      type: "url",
      name: `Dailymotion.com ${findItem.name}`,
      url: video,
      languages: ["en"],
    };
  }
  // Nothing found
  return null;
});

// Resolve handler's are resolving URL's and return a ready-to-play URL to the video.
exampleAddon.addResolveHandler(
  new RegExp("//videocnd.example.com/resolve-example/(.*)"),
  async (match, input, ctx) => {
    // Normally here a website will be fetched and the video links be extracted.
    // For this tutorial, we again do it with some static data:
    if (match[1] === "tt0807840") {
      // We can return an array of `ResolvedUrl`. If there is more than one object returned,
      // the user can select the stream in the video player settings.
      return [
        {
          url: "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.mp4",
          name: "Video in MP4 format",
          format: "mp4",
        },
        {
          url: "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm",
          name: "Video in WEBM format",
          format: "webm",
        },
      ];
    }

    throw new Error(`Can not resolve link with ID ${match[1]}`);
  }
);

// Another resolve handler hanlding `https://test-videos.co.uk/` links
exampleAddon.addResolveHandler(
  new RegExp("//test-videos.co.uk/(.*)"),
  async (match, input, ctx) => {
    // For example, open the website here with `await fetch(input.url);` and process the output.
    if (input.url === "https://test-videos.co.uk/jellyfish/mp4-h264") {
      return [
        {
          url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_30MB.mp4",
          quality: "1080p",
        },
        {
          url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_30MB.mp4",
          quality: "720p",
        },
        {
          url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_30MB.mp4",
          quality: "360p",
        },
      ];
    }

    throw new Error(`Can not resolvelink ${input.url}`);
  }
);

runCli([exampleAddon]);
