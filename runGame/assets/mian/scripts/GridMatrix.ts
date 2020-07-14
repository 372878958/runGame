import { _decorator, Component, Node, CCInteger } from 'cc';
import { GridBase } from './GridBase';
const { ccclass, property } = _decorator;

@ccclass('GridMatrix')
export class GridMatrix extends Component {
    @property({
        type: CCInteger,
        displayName: "长",
        readonly: true
    })
    h: number = 0;
    @property({
        type: CCInteger,
        displayName: "宽",
        readonly: true
    })
    w: number = 0;


    minX: number = 0;
    minZ: number = 0;
    maxX: number = 0;
    maxZ: number = 0;

    onLoad() {
        this.updateWH();
    }

    onFocusInEditor() {
        this.updateWH();
    }

    // 计算宽高
    protected updateWH() {
        let gb = this.node.getComponentsInChildren(GridBase);
        for (let v of gb) {
            if (v.node.position.x < this.minX) {
                this.minX = v.node.position.x;
            }
            if (v.node.position.z < this.minZ) {
                this.minZ = v.node.position.z;
            }
            if (v.node.position.x > this.maxX) {
                this.maxX = v.node.position.x;
            }
            if (v.node.position.z > this.maxZ) {
                this.maxZ = v.node.position.z;
            }
        }
        this.w = this.maxX - this.minX + 1;
        this.h = this.maxZ - this.minZ + 1;
    }
}
