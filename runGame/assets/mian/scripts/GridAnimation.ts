import { _decorator, Component, Node, AnimationComponent } from 'cc';
import { GridBase } from './GridBase';
const { ccclass, property, menu } = _decorator;

@ccclass('GridAnimation')
@menu("格子/循环动画基类")
export class GridAnimation extends GridBase {
    @property({
        type: AnimationComponent,
        displayName: "动画"
    })
    protected animation: AnimationComponent = null;

    @property({
        displayName: "是否播放",
    })
    protected get canPlayInEditor() {
        return this._canPlayInEditor;
    }
    protected set canPlayInEditor(b: boolean) {
        if (this._canPlayInEditor != b) {
            this._canPlayInEditor = b;
            this.onPlayInEditor(b);
        }
    }
    @property
    protected _canPlayInEditor: boolean = false;

    onFocusInEditor() {
        if (super.onFocusInEditor) {
            super.onFocusInEditor();
        }
        if (!this.animation) {
            this.animation = this.getComponent(AnimationComponent);
        }
    }

    onPlayInEditor(isPlay: boolean) {
        if (isPlay) {
            this.playDefaultAni();
        } else {
            this.stopAni();
        }
    }

    // 播放动画
    protected playClip(index: number) {
        if (CC_EDITOR == true && this.canPlayInEditor == false) {
            return;
        }
        let clip = this.animation.clips[index];
        if (clip) {
            this.animation.play(clip.name);
            let s = this.animation.getState(clip.name);
            return s;
        }
    }

    // 播放默认动画
    protected playDefaultAni() {
        if (CC_EDITOR == true && this.canPlayInEditor == false) {
            return;
        }
        this.animation.play();
    }

    // 停止播放动画
    protected stopAni() {
        this.animation.stop();
    }
}
