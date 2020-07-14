import { _decorator, Component, Node, AnimationComponent, ITriggerEvent } from 'cc';
import { GridAnimation } from './GridAnimation';
const { ccclass, property, icon,menu } = _decorator;

@ccclass('GridAnimationDelay')
@menu("格子/延迟动画")
export class GridAnimationDelay extends GridAnimation {
    @property({
        displayName: "动画播放延迟"
    })
    protected delay: number = 0;

    start() {
        if (super.start) {
            super.start();
        }
        this.scheduleOnce(() => {
            this.playDefaultAni();
        }, this.delay);
    }

    onPlayInEditor(isPlay: boolean) {
        if (isPlay) {
            this.scheduleOnce(() => {
                this.playDefaultAni();
            }, this.delay);
        } else {
            this.stopAni();
        }
    }
}
