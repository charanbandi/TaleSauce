import EasyStar from "easystarjs";

export interface MovementProvider {
  /** Returns a tile-path [ {x,y}, ... ] or [] if none. */
  findPath(grid: number[][], from: { x: number; y: number }, to: { x: number; y: number }): Promise<{ x: number; y: number }[]>;
}

export class EasyStarMovement implements MovementProvider {
  private es = new EasyStar.js();
  findPath(grid: number[][], from: { x: number; y: number }, to: { x: number; y: number }) {
    return new Promise<{ x: number; y: number }[]>((resolve) => {
      this.es.setGrid(grid);
      this.es.setAcceptableTiles([0]); // 0 = walkable
      this.es.findPath(from.x, from.y, to.x, to.y, (path) => resolve(path ?? []));
      this.es.calculate();
    });
  }
}
