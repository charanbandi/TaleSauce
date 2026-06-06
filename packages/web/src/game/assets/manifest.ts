/** Asset manifest. Scenes are drawn procedurally (officeArt.ts / farmArt.ts);
 *  only audio is loaded from disk now. */
export const TILE_SIZE = 16;

/** Audio assets: ambient loops and sound effects (served from /audio under publicDir). */
export const AUDIO: { key: string; url: string; loop?: boolean }[] = [
  { key: "ambient-farm",           url: "/audio/ambient-farm.m4a",           loop: true },
  { key: "ambient-office",         url: "/audio/ambient-office.mp3",         loop: true },
  { key: "sfx-task-start",         url: "/audio/sfx-task-start.ogg"                     },
  { key: "sfx-question",           url: "/audio/sfx-question.ogg"                       },
  { key: "sfx-done",               url: "/audio/sfx-done.ogg"                           },
  { key: "sfx-error",              url: "/audio/sfx-error.ogg"                          },
  { key: "sfx-permission",         url: "/audio/sfx-permission.ogg"                     },
  { key: "sfx-permission-resolve", url: "/audio/sfx-permission-resolve.ogg"             },
];
