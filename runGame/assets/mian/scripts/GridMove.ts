import { _decorator, Component, Node, ITriggerEvent, Vec3, v3 } from 'cc';
import { RoleControl, EQUIP_ATTR } from './RoleControl';
import { GridAnimationDelay } from './GridAnimationDelay';
const { ccclass, property, menu } = _decorator;

@ccclass('GridMove')
@menu("格子/移动块")
export class GridMove extends GridAnimationDelay {

    start() {
        if (super.start) {
            super.start();
        }

    }

    public onTransformChanged(dt: number) {
        this.onSetRolePos();
        if (super.onTransformChanged) {
            super.onTransformChanged(dt);
        }
    }

    // update(dt) {
    //     this.onSetRolePos();
    //     if (super.update) {
    //         super.update(dt);
    //     }
    // }

    protected onSetRolePos() {
        // 如果站在格子上了，就跟着格子走
        if (this.playerIsStandByThis) {
            let pos = v3(this.node.worldPosition);
            ++pos.y;
            RoleControl.instance.node.setPosition(pos);
        }
    }

    // 响应主角装备属性
    onEquipAttr() {
        super.onEquipAttr();
        let s = this.animation.getState(this.animation.defaultClip.name);
        if (s) {
            if (RoleControl.instance.getEquipAttr() & EQUIP_ATTR.MOVE_SLOW) {
                s.speed = 0.5;
            } else {
                s.speed = 1;
            }
        }
    }
}
