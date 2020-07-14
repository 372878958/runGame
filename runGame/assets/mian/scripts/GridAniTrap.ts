import { _decorator, CCInteger, ITriggerEvent } from 'cc';
import { GridAnimation } from './GridAnimation';
import { GRID_TYPE } from './GridBase';
const { ccclass, property, menu } = _decorator;

@ccclass('GridAniTrap')
@menu("格子/常态动画陷阱")
export class GridAniTrap extends GridAnimation {

    @property({
        type: GRID_TYPE,
        displayName: "格子类型",
        override: true,
    })
    protected gridType: GRID_TYPE = GRID_TYPE.区域伤害;

    @property({
        type: CCInteger,
        displayName: "动画间隔"
    })
    protected aniGap: number = 2;

    @property({
        type: CCInteger,
        displayName: "开始延迟"
    })
    protected beginDelay: number = 0;

    @property({
        displayName: "动画设置提示",
        readonly: true,
    })
    protected tip: string = "第一个为伤害动画，第二个为隐藏动画";

    start() {
        if (super.start) {
            super.start();
        }
        this.scheduleOnce(this.playDamageClip, this.beginDelay);
    }

    onPlayInEditor(isPlay: boolean) {
        if (isPlay) {
            this.scheduleOnce(this.playDamageClip, this.beginDelay);
        } else {
            this.stopAni();
        }
    }

    // 播放伤害动画
    protected playDamageClip() {
        let s = this.playClip(0);
        if (s) {
            this.scheduleOnce(this.playHideClip, s.duration);
        }
    }

    // 播放隐藏动画
    protected playHideClip() {
        let s = this.playClip(1);
        if (s) {
            this.scheduleOnce(this.playDamageClip, s.duration + this.aniGap);
        }
    }
}
