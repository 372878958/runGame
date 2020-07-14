import { _decorator, Component, Node } from 'cc';
const { ccclass, property, menu } = _decorator;

type AnimationEventCallback = ((...params: any[]) => void);

@ccclass('AnimationEvent')
@menu("扩展组件/动画事件")
export class AnimationEventCom extends Component {
    protected listeners: AnimationEventCallback[] = [];

    addEventListener(callback: AnimationEventCallback): boolean {
        let i = this.listeners.indexOf(callback);
        if (i == -1) {
            this.listeners.push(callback);
            return true;
        }
        return false;
    }

    remEventListener(callback: AnimationEventCallback): boolean {
        let i = this.listeners.indexOf(callback);
        if (i == -1) {
            return false;
        }
        this.listeners.splice(i, 1);
        return true;
    }

    protected 动画事件(...params: any[]) {
        for (let v of this.listeners) {
            v(params);
        }
    }
}
