import { _decorator, ITriggerEvent, Vec3 } from 'cc';
import { GridBase } from './GridBase';
import { GridSwitchTarget } from './GridSwitchTarget';
import { ROLE_STATE, RoleControl, EQUIP_ATTR } from './RoleControl';
const { ccclass, property, menu } = _decorator;

@ccclass('GridSwitch')
@menu("格子/机关开关")
export class GridSwitch extends GridBase {

    @property({
        type: GridSwitchTarget,
        displayName: "开关目标"
    })
    protected switchTarget: GridSwitchTarget[] = [];

    @property({
        displayName: "重复触发",
        tooltip: "是否可以重复触发"
    })
    protected repeatTrigger: boolean = false;

    // 是否已经触发
    protected isTriggered: boolean = false;

    // 移动后逻辑
    onMoveAfter(pos: Vec3): ROLE_STATE {
        let state: ROLE_STATE = null;
        if (super.onMoveAfter) {
            state = super.onMoveAfter(pos);
        }
        // 是否自动触发
        let isAutoTrigger = false;
        if (this.autoSwitch && RoleControl.get2PointsDis(pos, this.getPos()) <= this.autoSwitchDis) {
            isAutoTrigger = true;
        }
        // 
        if (this.switchTarget.length && (this.isTriggered == false || this.repeatTrigger == true) && (isAutoTrigger || this._isPlayerEnter || this.playerIsStandByThis)) {
            for (let v of this.switchTarget) {
                v.onSwitch(this);
            }
            this.isTriggered = true;
        }
        return state;
    }

    // 移动前逻辑
    onMoveBefore(pos: Vec3): ROLE_STATE {
        if (super.onMoveBefore) {
            return super.onMoveBefore(pos);
        }
    }

    // 格子位置变化了
    onPosChanged(pos: Vec3): ROLE_STATE {
        if (super.onPosChanged) {
            return super.onPosChanged(pos);
        }
    }

    protected autoSwitchDis: number = 3; // 自动触发范围
    protected autoSwitch: boolean = false;// 是否开启自动触发
    // 响应主角装备属性
    onEquipAttr() {
        super.onEquipAttr();
        if (RoleControl.instance.getEquipAttr() & EQUIP_ATTR.AUTO_SWITCH) {
            // 自动触发附近机关
            this.autoSwitch = true;
        } else {
            this.autoSwitch = false;
        }
    }
}
