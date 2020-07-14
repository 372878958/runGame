import { _decorator, Component, Node } from 'cc';
import { GridBase } from './GridBase';
const { ccclass, property } = _decorator;

@ccclass('DebugGridPos')
export class DebugGridPos extends Component {

    @property({
        type: GridBase,
        displayName: "调试目标"
    })
    protected gird: GridBase = null;

    update(dt: number) {
        if (this.gird) {
            this.node.worldPosition = this.gird.getPos();
        }
    }
}
