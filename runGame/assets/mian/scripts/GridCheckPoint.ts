import { _decorator, Component, Node, Vec3 } from 'cc';
import { GridBase, GRID_TYPE } from './GridBase';
import { ROLE_STATE, RoleControl } from './RoleControl';
const { ccclass, property, menu } = _decorator;

@ccclass('GridCheckPoint')
@menu("格子/检查点")
export class GridCheckPoint extends GridBase {
    protected gridType: GRID_TYPE = GRID_TYPE.触发;
    // 移动后逻辑
    onMoveAfter(pos: Vec3): ROLE_STATE {
        let state: ROLE_STATE = null;
        if (super.onMoveAfter) {
            state = super.onMoveAfter(pos);
        }
        if (this._isPlayerEnter) {
            // 记录检查点
            RoleControl.instance.curCheckPoint = this;
        }
        return state;
    }
}
