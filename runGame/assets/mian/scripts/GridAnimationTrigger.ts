import { _decorator, Vec3 } from 'cc';
import { GridAnimation } from './GridAnimation';
import { ROLE_STATE } from './RoleControl';
const { ccclass, property, menu } = _decorator;

@ccclass('GridAnimationTrigger')
@menu("格子/触发动画")
export class GridAnimationTrigger extends GridAnimation {

    @property({
        displayName: "动画顺序说明",
        readonly: true,
    })
    protected tip = "第一个动画为触发动画，第二个动画为触发后，发动动画";


    @property({
        displayName: "触发延迟"
    })
    protected triggerTime: number = 1;

    @property({
        displayName: "触发范围"
    })
    protected triggerRange: number = 0;


    onMoveAfter(pos: Vec3): ROLE_STATE {
        let state = super.onMoveAfter(pos);
        if (this._isPlayerEnter || this.playerIsStandByThis) {
            this.playClip(0);
            this.scheduleOnce(() => {
                this.playClip(1);
                this.enabled = false;
            }, this.triggerTime);
        }
        return state;
    }
}
