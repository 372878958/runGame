import { _decorator, Vec3, v3, Tween } from 'cc';
import { GridAnimation } from './GridAnimation';
import { AnimationEventCom } from './AnimationEventCom';
import { ROLE_STATE, RoleControl, EQUIP_ATTR } from './RoleControl';
import { GridBase } from './GridBase';
const { ccclass, property } = _decorator;

// 弩箭状态
enum CROSSBOW_STATE {
    ready,  // 准备发射
    shoot,  // 发射
    wait,   // 等待箭移出画面
}

@ccclass('GridCrossbow')
export class GridCrossbow extends GridAnimation {

    @property({
        displayName: "弩箭转向速度(秒/度)"
    })
    protected rotateSpeed: number = 360;

    @property({
        displayName: "警戒范围"
    })
    protected attackDis: number = 10;

    @property({
        displayName: "发射间隔（秒）"
    })
    protected attackGap: number = 1;

    @property({
        displayName: "箭矢速度（秒/米）"
    })
    protected arrowSpeed: number = 10;

    @property({
        displayName: "箭消失距离（米）"
    })
    protected arrowMaxDis: number = 20;

    @property({
        type: GridBase,
        displayName: "箭，节点"
    })
    protected arrowNode: GridBase = null;

    @property({
        type: AnimationEventCom,
        displayName: "动画事件"
    })
    protected aec: AnimationEventCom = null;

    protected shootCD: number = 0;      // 发射倒计时
    protected curState: CROSSBOW_STATE = CROSSBOW_STATE.ready;
    // protected tarRotateY = 0;        // 弩箭台目标旋转角度
    private _isActivate = false;        // 是否是被激活（进入攻击范围了）
    protected arrowBaseX: number = -0.49; // 箭矢发射时的初始位置

    protected set isActivate(b: boolean) {
        if (this._isActivate != b) {
            this._isActivate = b;
            if (b) {
                this.shootCD = this.attackGap;
            }
        }
    }
    protected get isActivate(): boolean {
        return this._isActivate;
    }

    onLoad() {
        if (super.onLoad) {
            super.onLoad();
        }
        if (this.aec) {
            this.aec.addEventListener(this.onAniEvent.bind(this));
        }
        if (this.arrowNode) {
            // this.arrowBaseX = this.arrowNode.node.position.x;
            this.arrowNode.setDamageCallback(this.shootEnd.bind(this));
        }
    }

    // onEnable() {
    //     if (super.onEnable) {
    //         super.onEnable();
    //     }
    //     this.animation.on(AnimationComponent.EventType.FINISHED, ()=>{
    //        let a = 0; 
    //     });
    // }

    // onDisable() {
    //     if (super.onDisable) {
    //         super.onDisable();
    //     }
    // }

    onDestroy() {
        if (super.onDestroy) {
            super.onDestroy();
        }
        if (this.aec) {
            this.aec.remEventListener(this.onAniEvent.bind(this));
        }
    }

    update(dt: number) {
        if (super.update) {
            super.update(dt);
        }
        if (this.isActivate) {
            switch (this.curState) {
                case CROSSBOW_STATE.ready:
                    this.shootCD -= dt;
                    if (this.shootCD <= 0 && RoleControl.instance.isLive()) { // 开始发射
                        // 设置状态
                        this.curState = CROSSBOW_STATE.shoot;
                        // 播放动画
                        this.animation.play();
                    }
                    break;
                case CROSSBOW_STATE.shoot:
                    break;
                case CROSSBOW_STATE.wait:
                    break;
            }
        }
        // 箭矢移动逻辑
        this.onArrowMove(dt);
    }

    // 箭矢移动
    protected onArrowMove(dt: number) {
        if (this.curState == CROSSBOW_STATE.wait) {
            // 更新箭矢位置
            let pos = v3(this.arrowNode.node.position);
            pos.x -= dt * (this.isArrowSlow ? this.arrowSpeed / 2 : this.arrowSpeed);
            this.arrowNode.node.position = pos;
            // 箭矢到达最远距离或者射中目标
            if (pos.x < -this.arrowMaxDis) {
                this.shootEnd();
            }
        }
    }

    // 箭矢发射结束
    protected shootEnd() {
        // 重置状态
        this.curState = CROSSBOW_STATE.ready;
        // 隐藏箭矢
        this.arrowNode.node.active = false;
        // 重新计算攻击间隔
        this.shootCD = this.attackGap;
        // 重新转向
        this.onMove(RoleControl.instance.getCurPos(), true);
    }

    private rotateTWeen: Tween = null;

    // 角色移动
    protected onMove(pos: Vec3, rotate: boolean) {
        let selfPos = this.getPos();
        if (pos.y == selfPos.y) {
            let dis = RoleControl.get2PointsDis(pos, selfPos);
            if (dis <= this.attackDis) {
                this.isActivate = true;
                if (rotate && this.curState == CROSSBOW_STATE.ready && !pos.equals(this.getPos())) {
                    // // 防止角度超过360
                    // let a = v3(this.node.eulerAngles);
                    // a.y %= 360;
                    // this.node.eulerAngles = a;
                    // // 计算弩箭台的旋转角度
                    // let curAngles = v3(this.node.eulerAngles);
                    this.node.lookAt(pos);
                    // let tarRotateY = this.node.eulerAngles.y;
                    // this.node.eulerAngles = curAngles;
                    // // 计算需要旋转的角度
                    // let angle = curAngles.y - tarRotateY;
                    // // 防止角度旋转角度大于180度
                    // if (Math.abs(angle) > 180) {
                    //     tarRotateY > 0 ? tarRotateY -= 360 : tarRotateY += 360;
                    //     angle = curAngles.y - tarRotateY;
                    // }
                    // // 计算旋转时间
                    // let needTime = Math.abs(angle / this.rotateSpeed);
                    // // 先停止旋转动画
                    // if (this.rotateTWeen) {
                    //     this.rotateTWeen.stop();
                    // }
                    // // 开始旋转动画
                    // this.rotateTWeen = tween(this.node)
                    //     .to(needTime, { eulerAngles: v3(0, tarRotateY, 0) })
                    //     .call(() => {
                    //         this.rotateTWeen = null;
                    //     })
                    //     .start();
                }
            } else {
                this.isActivate = false;
            }
        } else {
            this.isActivate = false;
        }
    }

    // 移动后逻辑
    onMoveAfter(pos: Vec3): ROLE_STATE {
        this.onMove(pos, true);
        if (super.onMoveAfter) {
            return super.onMoveAfter(pos);
        }
    }

    // 移动前逻辑
    onMoveBefore(pos: Vec3): ROLE_STATE {
        this.onMove(pos, false);
        if (super.onMoveBefore) {
            return super.onMoveBefore(pos);
        }
    }

    // 箭矢被发射出来了
    protected onAniEvent(...params: any[]) {
        this.curState = CROSSBOW_STATE.wait;
        let pos = v3(this.arrowNode.node.position);
        pos.x = this.arrowBaseX;
        this.arrowNode.reset();
        this.arrowNode.node.position = pos;
        this.arrowNode.node.active = true;
    }

    protected isArrowSlow = false;

    // 响应主角装备属性
    onEquipAttr() {
        super.onEquipAttr();
        if (RoleControl.instance.getEquipAttr() & EQUIP_ATTR.ARROW_SLOW) {
            this.isArrowSlow = true;
        } else {
            this.isArrowSlow = false;
        }
    }
}
