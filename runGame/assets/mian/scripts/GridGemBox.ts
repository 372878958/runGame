import { _decorator, Component, Node, Vec3 } from 'cc';
import { GridBase } from './GridBase';
import { ROLE_STATE, RoleControl, EQUIP_ATTR } from './RoleControl';
const { ccclass, property, menu } = _decorator;

@ccclass('GridGemBox')
@menu("格子/宝箱")
export class GridGemBox extends GridBase {

    protected _openBox = false; // 宝箱是否被开启

    set openBox(b: boolean) {
        if (this._openBox != b) {
            this._openBox = b;
        }
    }

    get openBox(): boolean {
        return this._openBox;
    }

    onMoveBefore(pos: Vec3): ROLE_STATE {
        let state = super.onMoveBefore(pos);
        // 是否自动触发
        let isAutoTrigger = false;
        if (this.autoSwitch && RoleControl.get2PointsDis(pos, this.getPos()) <= this.autoSwitchDis) {
            isAutoTrigger = true;
        }
        // 
        if (isAutoTrigger || state == ROLE_STATE.BLOCK) {
            // 宝箱开启
            this.openBox = true;
        }
        return state;
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
