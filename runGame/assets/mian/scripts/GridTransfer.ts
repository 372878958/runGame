import { _decorator, Component, Node, Vec3, v3 } from 'cc';
import { GridBase, GRID_TYPE } from './GridBase';
import { ROLE_STATE, RoleControl } from './RoleControl';
const { ccclass, property, menu } = _decorator;

@ccclass('GridTransfer')
@menu("格子/传送阵")
export class GridTransfer extends GridBase {
    protected gridType: GRID_TYPE = GRID_TYPE.触发;

    @property({
        type: GridBase,
        displayName: "传送目标",
    })
    protected targetGrid: GridBase = null;

    @property({
        type: Vec3,
        displayName: "传送位置偏移",
        tooltip: "传送到目标位置后 偏移坐标"
    })
    protected offsetPos: Vec3 = v3(0, 0, 0);

    @property({
        displayName: "是否跳跃",
        tooltip: "是否跳跃到目标"
    })
    protected isJump = false;

    protected isCanTransfer = true;

    // 移动后逻辑
    onMoveAfter(pos: Vec3): ROLE_STATE {
        let state: ROLE_STATE = null;
        if (super.onMoveAfter) {
            state = super.onMoveAfter(pos);
        }
        if (this._isPlayerEnter && this.isCanTransfer && RoleControl.instance.getRoleState() != ROLE_STATE.TRANSFER && this.targetGrid) {
            this.isCanTransfer = false;
            if (this.isJump) {
                // 跳跃到目标
                RoleControl.instance.jumpTo(this.targetGrid.getPos());
                return ROLE_STATE.JUMP_TO;
            } else {
                // 传送目标
                let pos = v3(this.targetGrid.getPos());
                RoleControl.instance.node.worldPosition = pos.add(this.offsetPos);
                return ROLE_STATE.TRANSFER;
            }
        } else {
            this.isCanTransfer = !this._isPlayerEnter;
        }
        return state;
    }
}
