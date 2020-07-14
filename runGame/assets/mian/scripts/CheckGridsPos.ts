import { _decorator, Component, Node, Vec3, v3 } from 'cc';
import { GridBase } from './GridBase';
const { ccclass, property, menu, executeInEditMode } = _decorator;

@ccclass('CheckGridsPos')
@menu("格子/重合检测")
// @executeInEditMode
export class CheckGridsPos extends Component {
    // 格子地图
    protected gridsMap: { [x: number]: { [y: number]: { [z: number]: GridBase } } } = {};

    // start() {
    //     if (CC_EDITOR) {
    //         this.check();
    //     } else {
    //         this.enabled = false;
    //     }
    // }

    // 检测重合
    protected check() {
        this.gridsMap = {};
        // 所有子节点上的格子
        let grids = this.getComponentsInChildren(GridBase);
        // cc.error("grids = " + grids.length);
        // cc.error("this.node.children.length = " + this.node.children.length);
        // 所有重合的格子
        let coincideGrids: GridBase[] = [];
        for (let v of grids) {
            if (!this.setGrid(v)) {
                coincideGrids.push(v);
            }
        }
        // 平铺所有重合的格子
        this.tileGrids(coincideGrids);
    }

    // protected getGridBasesInChildren(node: Node) {
    //     let ret: GridBase[] = [];
    //     let getChild = (node: Node) => {
    //         let g = node.getComponent(GridBase);
    //         if (g) {
    //             ret.push(g);
    //         }
    //         for (let v of node.children) {
    //             getChild(v);
    //         }
    //     }
    //     getChild(node);
    //     return ret;
    // }

    // 平铺所有重合的格子
    protected tileGrids(grids: GridBase[]) {
        let curPos = v3(0, 0, 0);
        let index = 0;
        // 平铺格子
        let tile = (grid: GridBase) => {
            grid.node.setWorldPosition(v3(curPos));
            if (!this.setGrid(grid)) {
                switch (index % 2) {
                    case 0:
                        curPos.x = Math.abs(curPos.x) + 1;
                        break;
                    case 1:
                        curPos.x = -curPos.x;
                        break;
                }
                ++index;
                tile(grid);
            }
        }
        // 平铺所有格子
        for (let v of grids) {
            index = 0;
            curPos = v3(v.node.worldPosition);
            tile(v);
        }
    }

    // 在地图上设置格子
    protected setGrid(grid: GridBase): boolean {
        let pos = grid.node.worldPosition;
        if (!this.gridsMap[pos.x]) {
            this.gridsMap[pos.x] = {};
        }
        if (!this.gridsMap[pos.x][pos.y]) {
            this.gridsMap[pos.x][pos.y] = {};
        }
        if (!this.gridsMap[pos.x][pos.y][pos.z]) {
            this.gridsMap[pos.x][pos.y][pos.z] = grid;
            return true;
        }
        return false;
    }

    // 根据坐标获取格子
    protected getGrid(pos: Vec3): GridBase {
        let x = this.gridsMap[pos.x];
        if (x) {
            let y = x[pos.y];
            if (y) {
                let grid = y[pos.z];
                if (grid) {
                    return grid;
                }
            }
        }
        return null;
    }

    onFocusInEditor() {
        this.check();
    }
    onLostFocusInEditor() {
        this.check();
    }
}
