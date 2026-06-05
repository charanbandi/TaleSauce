export interface ActionSpot {
  id: string;
  tile: { x: number; y: number };
  animation: string;     // animation key to play when idle at this spot
  label: string;
  primaryWork?: boolean; // the workstation for real tasks
}

export const FARM_SPOTS: ActionSpot[] = [
  { id: "garden",  tile: { x: 5,  y: 10 }, animation: "farm-work",  label: "Garden",     primaryWork: true },
  { id: "shower",  tile: { x: 14, y: 3  }, animation: "idle",       label: "Shower" },
  { id: "pond",    tile: { x: 17, y: 11 }, animation: "swim-idle",  label: "Pond (swim)" },
  { id: "couch",   tile: { x: 8,  y: 5  }, animation: "sit-idle",   label: "Couch (TV)" },
  { id: "bed",     tile: { x: 11, y: 2  }, animation: "sleep-idle", label: "Bed (sleep)" },
];

export const OFFICE_SPOTS: ActionSpot[] = [
  { id: "desk",       tile: { x: 6,  y: 5 }, animation: "type-work",  label: "Desk",          primaryWork: true },
  { id: "whiteboard", tile: { x: 3,  y: 3 }, animation: "point-idle", label: "Whiteboard" },
  { id: "coffee",     tile: { x: 18, y: 4 }, animation: "drink-idle", label: "Coffee" },
  { id: "couch",      tile: { x: 21, y: 8 }, animation: "sit-idle",   label: "Couch (chill)" },
];

export function workstationFor(spots: ActionSpot[]): ActionSpot {
  return spots.find((s) => s.primaryWork) ?? spots[0];
}
