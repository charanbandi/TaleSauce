export interface ActionSpot {
  id: string;
  tile: { x: number; y: number };
  animation: string;     // animation key to play when an agent uses it
  label: string;
  primaryWork?: boolean; // the workstation for real tasks
}

export const FARM_SPOTS: ActionSpot[] = [
  { id: "garden", tile: { x: 4, y: 10 }, animation: "work-loop", label: "Garden", primaryWork: true },
  { id: "shower", tile: { x: 14, y: 4 }, animation: "idle", label: "Shower" },
  { id: "pond", tile: { x: 18, y: 12 }, animation: "idle", label: "Pond (swim)" },
  { id: "couch", tile: { x: 8, y: 6 }, animation: "idle", label: "Couch (TV)" },
  { id: "bed", tile: { x: 11, y: 3 }, animation: "idle", label: "Bed (sleep)" },
];

export const OFFICE_SPOTS: ActionSpot[] = [
  { id: "desk", tile: { x: 6, y: 6 }, animation: "work-loop", label: "Desk", primaryWork: true },
  { id: "whiteboard", tile: { x: 3, y: 3 }, animation: "idle", label: "Whiteboard" },
  { id: "coffee", tile: { x: 12, y: 4 }, animation: "idle", label: "Coffee" },
  { id: "couch", tile: { x: 14, y: 9 }, animation: "idle", label: "Couch (chill)" },
];

export function workstationFor(spots: ActionSpot[]): ActionSpot {
  return spots.find((s) => s.primaryWork) ?? spots[0];
}
