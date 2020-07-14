import { _decorator } from 'cc';
import { GridAnimation } from './GridAnimation';
import { GridSwitch } from './GridSwitch';
const { ccclass, property, menu } = _decorator;

@ccclass('GridSwitchTarget')
@menu("格子/机关")
export class GridSwitchTarget extends GridAnimation {
    // @property({
    //     displayName: "动画说明",
    //     readonly: true
    // })
    // protected tip = "第一个动画为开，第二个动画为关";

    // protected _isOpen = false;
    // get isOpen() {
    //     return this._isOpen;
    // }
    // set isOpen(b: boolean) {
    //     if (this._isOpen != b) {
    //         this._isOpen = b;
    //         b ? this.playOpen() : this.playOff();
    //     }
    // }

    // // 播放开动画
    // protected playOpen() {
    //     this.playClip(0);
    // }

    // // 播放关动画
    // protected playOff() {
    //     this.playClip(1);
    // }

    // 触发开关了，播放动画
    onSwitch(s:GridSwitch) {
        this.animation.play();
    }
}
