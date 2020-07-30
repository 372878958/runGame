import { _decorator, Component, Node, v3, systemEvent, SystemEvent, macro, Touch, LabelComponent, tween, Tween, SkeletalAnimationComponent, AnimationComponent, Vec3 } from 'cc';
import { GridBase } from './GridBase';
import { PositionCorrection } from './PositionCorrection';
import { GridCheckPoint } from './GridCheckPoint';
const { ccclass, property, executeInEditMode } = _decorator;

// 角色状态
export enum ROLE_STATE {
    STAND,          // 站立
    BLOCK,          // 遇到障碍
    MOVE_BACK,      // 回退
    DROP,           // 下落
    JUMP,           // 跳跃
    JUMP_TO,        // 跳跃至
    MOVE_UP,        // 向前移动
    MOVE_DOWN,      // 向下移动
    MOVE_LEFT,      // 向左移动
    MOVE_RIGHT,     // 向右移动
    BE_MOVE_UP,     // 被向前移动
    BE_MOVE_DOWN,   // 被向下移动
    BE_MOVE_LEFT,   // 被向左移动
    BE_MOVE_RIGHT,  // 被向右移动
    DEAD,           // 死亡
    TRANSFER,       // 传送
    SLIDER,         // 滑动中
}

// 移动方向
export enum MOVE_DIR {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

// 装备属性
export enum EQUIP_ATTR {
    MOVE_SLOW = 1 << 1,     // 移动减速
    AUTO_SWITCH = 1 << 2,   // 自动开启附近机关
    ARROW_SLOW = 1 << 3,    // 后降低敌人射出弓箭的移动速度
}

@ccclass('RoleControl')
@executeInEditMode
export class RoleControl extends Component {

    @property({
        type: Node,
        displayName: "模型节点"
    })
    protected modelNode: Node = null;

    @property({
        displayName: "移动速度",
        tooltip: "移动1格所需时间(秒)"
    })
    protected moveSpeed: number = 0.1;         // 当前移动速度

    @property({
        type: Node,
        displayName: "摄像机节点"
    })
    protected cameraNode: Node = null;

    @property({
        type: AnimationComponent,
        displayName: "无敌动画"
    })
    protected animation: AnimationComponent = null;

    @property({
        type: LabelComponent,
        displayName: "血量显示"
    })
    protected hpLabel: LabelComponent = null;

    // 是否无敌
    protected _invincible = false;
    set invincible(b: boolean) {
        if (this._invincible != b) {
            this._invincible = b;
            if (b) {
                this.animation.play();
            } else {
                this.animation.stop();
                let s = this.animation.getState(this.animation.defaultClip.name);
                if (s) {
                    s.setTime(0);
                    s.sample();
                }
            }
        }
    }
    get invincible() {
        return this._invincible;
    }

    // 血量
    protected _HP: number = null;
    protected set HP(hp: number) {
        if (this._HP != hp) {
            this._HP = hp;
            if (this.hpLabel) {
                this.hpLabel.string = "HP:" + hp;
            }
        }
    }
    protected get HP() {
        return this._HP;
    }

    // 收到伤害 返回活着还是死亡
    public onDamageHP(damage: number): boolean {
        if (this.invincible || this.roleState == ROLE_STATE.DEAD) {
            // 无敌和死亡不受伤害
            return true;
        }
        this.HP -= damage;
        if (this.HP < 0) {
            let a = 0;
        }
        if (this.HP <= 0) { // 角色死亡
            // 播放相关ui和动画todo

            // 检查点重生
            this.scheduleOnce(this.reviveByCheckPoint, 1);
            return false;
        } else {
            this.invincibleTime(1);
            return true;
        }
    }

    public static instance: RoleControl = null;
    // protected isDrop = false;                         // 是否掉落了
    public curMoveGrids: GridBase[] = [];                // 是否站在移动的格子上(用引用计数的形式表现)
    public curCheckPoint: GridCheckPoint = null;         // 当前检查点

    protected skeletalAnimation: SkeletalAnimationComponent = null; // 骨骼动画
    // protected moveDir: ROLE_STATE = ROLE_STATE.NULL;   // 当前移动方向
    protected curEquipAttr: number = 0;  // 当前装备包含属性 

    onLoad() {
        RoleControl.instance = this;
        this.skeletalAnimation = this.modelNode.getComponent(SkeletalAnimationComponent);
        this.skeletalAnimation.stop();
    }

    start() {
        // 测试相关
        this.HP = 3;
        this.curEquipAttr |= EQUIP_ATTR.MOVE_SLOW;
        // this.curEquipAttr |= EQUIP_ATTR.AUTO_SWITCH;
        this.curEquipAttr |= EQUIP_ATTR.ARROW_SLOW;
        this.onEquipChanged();
    }

    onEnable() {
        // 移动监听
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        //键盘监听
        systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        //触摸监听
        systemEvent.on(SystemEvent.EventType.TOUCH_START, this.onViewTouchStart, this);
        systemEvent.on(SystemEvent.EventType.TOUCH_END, this.onViewTouchEnd, this);
    }

    onDisable() {
        // 移动监听
        this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        //键盘监听
        systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        //触摸监听
        systemEvent.off(SystemEvent.EventType.TOUCH_START, this.onViewTouchStart, this);
        systemEvent.off(SystemEvent.EventType.TOUCH_END, this.onViewTouchEnd, this);
    }

    onFocusInEditor() {
        if (!this.animation) {
            this.animation = this.getComponent(AnimationComponent);
        }
    }

    onLostFocusInEditor() {
        this.onFocusInEditor();
    }

    protected onTransformChanged() {
        this.curPos = null;
    }

    // 重置角色
    reset() {
        this.curPos = null;
        this.curCheckPoint = null;
        this.node.position = v3(0, 1, 0);
        this.setState(ROLE_STATE.STAND);
    }

    // 从检查点复活
    reviveByCheckPoint() {
        // 重置血量
        this.HP = 3;
        // 记录检查点
        let curCheckPoint = this.curCheckPoint;
        // 重置角色
        this.reset();
        // 设置检查点
        this.curCheckPoint = curCheckPoint;
        if (this.curCheckPoint) {
            // 设置检查点坐标
            this.node.position = this.curCheckPoint.getPos();
            // 执行移动后逻辑
            this.onMoveAfter();
        }
    }

    protected rotateTween: Tween = null;
    update(dt: number) {
        // 设置摄像机位置
        if (this.cameraNode) {
            let pos = v3(this.node.position.x, this.cameraNode.position.y, this.node.position.z);
            this.cameraNode.setPosition(pos);
        }
    }

    // 装备变更
    protected onEquipChanged() {
        for (let v of this.allGrid) {
            v.onEquipAttr();
        }
    }

    // 获取角色当前装备属性
    public getEquipAttr(): number {
        return this.curEquipAttr;
    }

    // 获取角色状态
    public getRoleState() {
        return this.roleState;
    }

    // 角色身上的缓动
    protected roleTween: Tween = null;
    // 角色当前状态
    protected roleState: ROLE_STATE = ROLE_STATE.STAND;
    // 设置角色状态
    protected setState(roleState: ROLE_STATE, grid: GridBase = null) {
        // 待机的设置
        let onStand = () => {
            // 待机
            this.roleState = roleState;
            // 先重置缓动
            if (this.roleTween) {
                this.roleTween.stop();
                this.roleTween = null;
            }
            this.skeletalAnimation.stop();
        }

        // 被动状态
        switch (roleState) {
            case ROLE_STATE.STAND:
                onStand();
                return;
            case ROLE_STATE.DROP:
                if (this.roleState == ROLE_STATE.DROP) {
                    let a = 0;
                }
                // 坠落
                onStand();
                // 坠落动画
                let pos = PositionCorrection.correction(this.node.position);
                ++pos.y;
                tween(this.node)
                    .to(this.moveSpeed, { position: pos })
                    .to(1, { position: v3(pos.x, pos.y - 10, pos.z) }, { easing: "sineIn" })
                    .call(this.reviveByCheckPoint.bind(this))
                    .start();
                return;
            case ROLE_STATE.BLOCK: // 遇到障碍
                onStand();
                // 播放受阻动画 todo
                this.roleState = ROLE_STATE.STAND;
                return;
            case ROLE_STATE.MOVE_BACK: // 回退
                // 根据状态设置移动方向
                let moveDir: MOVE_DIR = null;
                switch (this.roleState) {
                    case ROLE_STATE.MOVE_UP:
                        moveDir = MOVE_DIR.DOWN;
                        break;
                    case ROLE_STATE.MOVE_DOWN:
                        moveDir = MOVE_DIR.UP;
                        break;
                    case ROLE_STATE.MOVE_LEFT:
                        moveDir = MOVE_DIR.RIGHT;
                        break;
                    case ROLE_STATE.MOVE_RIGHT:
                        moveDir = MOVE_DIR.LEFT;
                        break;
                }
                this.moveLogic(moveDir);
                return;
            case ROLE_STATE.BE_MOVE_UP:
                onStand();
                this.moveLogic(MOVE_DIR.UP, grid ? grid.getCurSpeed() : this.moveSpeed);
                return;
            case ROLE_STATE.BE_MOVE_DOWN:
                onStand();
                this.moveLogic(MOVE_DIR.DOWN), grid ? grid.getCurSpeed() : this.moveSpeed;
                return;
            case ROLE_STATE.BE_MOVE_LEFT:
                onStand();
                this.moveLogic(MOVE_DIR.LEFT, grid ? grid.getCurSpeed() : this.moveSpeed);
                return;
            case ROLE_STATE.BE_MOVE_RIGHT:
                onStand();
                this.moveLogic(MOVE_DIR.RIGHT, grid ? grid.getCurSpeed() : this.moveSpeed);
                return;
            case ROLE_STATE.DEAD:
                // 角色死亡啥也干不了
                return;
            case ROLE_STATE.TRANSFER:
                onStand();
                // 被传送了 执行移动后逻辑
                this.onMoveAfter();
                return;
            case ROLE_STATE.SLIDER:
                onStand();
                this.moveLogic(this.lastMoveDir);
                return;
        }

        // 只有待机时可操作（主动状态）
        if (this.roleState == ROLE_STATE.STAND) {
            // 设置状态
            this.roleState = roleState;
            // 先重置缓动
            if (this.roleTween) {
                this.roleTween.stop();
                this.roleTween = null;
            }
            if (this.rotateTween) {
                this.rotateTween.stop();
                this.rotateTween = null;
            }
            // 转向
            let rotateSpeed = 720;// 转向速度 每秒/角度
            switch (this.roleState) {
                case ROLE_STATE.MOVE_UP:
                    this.rotateTween = tween(this.modelNode)
                        .to(Math.abs(this.modelNode.eulerAngles.y) / rotateSpeed, { eulerAngles: v3(0, 0, 0) })
                        .call(() => {
                            this.rotateTween = null;
                        })
                        .start();
                    break;
                case ROLE_STATE.MOVE_DOWN:
                    let rotateY = this.modelNode.eulerAngles.y > 0 ? 180 : -180; // 防止旋转270度
                    this.rotateTween = tween(this.modelNode)
                        .to(Math.abs(this.modelNode.eulerAngles.y - rotateY) / rotateSpeed, { eulerAngles: v3(0, rotateY, 0) })
                        .call(() => {
                            this.rotateTween = null;
                        })
                        .start();
                    break;
                case ROLE_STATE.MOVE_LEFT:
                    if (this.modelNode.eulerAngles.y == -180) { // 防止旋转270度
                        this.modelNode.eulerAngles = v3(0, 180, 0);
                    }
                    this.rotateTween = tween(this.modelNode)
                        .to(Math.abs(this.modelNode.eulerAngles.y - 90) / rotateSpeed, { eulerAngles: v3(0, 90, 0) })
                        .call(() => {
                            this.rotateTween = null;
                        })
                        .start();
                    break;
                case ROLE_STATE.MOVE_RIGHT:
                    if (this.modelNode.eulerAngles.y == 180) { // 防止旋转270度
                        this.modelNode.eulerAngles = v3(0, -180, 0);
                    }
                    this.rotateTween = tween(this.modelNode)
                        .to(Math.abs(this.modelNode.eulerAngles.y + 90) / rotateSpeed, { eulerAngles: v3(0, -90, 0) })
                        .call(() => {
                            this.rotateTween = null;
                        })
                        .start();
                    break;
            }
            // 根据状态设置移动方向
            let moveDir: MOVE_DIR = null;
            switch (this.roleState) {
                case ROLE_STATE.MOVE_UP:
                    moveDir = MOVE_DIR.UP;
                    break;
                case ROLE_STATE.MOVE_DOWN:
                    moveDir = MOVE_DIR.DOWN;
                    break;
                case ROLE_STATE.MOVE_LEFT:
                    moveDir = MOVE_DIR.LEFT;
                    break;
                case ROLE_STATE.MOVE_RIGHT:
                    moveDir = MOVE_DIR.RIGHT;
                    break;
            }
            // 移动逻辑
            this.moveLogic(moveDir);
        }
    }

    protected lastMoveDir: MOVE_DIR = null;
    // 移动逻辑
    protected moveLogic(dir: MOVE_DIR, speed: number = null) {
        this.lastMoveDir = dir;
        // if (!speed || speed > this.moveSpeed) {
        //     speed = this.moveSpeed;
        // } else {
        //     speed -= 0.01;
        // }
        if (!speed) {
            speed = this.moveSpeed;
        } else {
            // speed -= 0.02;
            speed /= 1.5;
        }
        let movePos = PositionCorrection.correction(this.node.position);
        switch (dir) {
            case MOVE_DIR.UP:
                --movePos.z;
                break;
            case MOVE_DIR.DOWN:
                ++movePos.z;
                break;
            case MOVE_DIR.LEFT:
                --movePos.x;
                break;
            case MOVE_DIR.RIGHT:
                ++movePos.x;
                break;
        }
        // 移动前逻辑
        let state = this.onMoveBefore(movePos);
        // 判断是否可以移动
        if (state == this.roleState) {// 可以移动
            // 设置动作
            this.skeletalAnimation.play("Take 001");

            // let x = movePos.x - this.node.position.x;
            // let z = movePos.z - this.node.position.z;
            // let w = Math.abs(x) + Math.abs(z);
            // if (w > 1) {
            //     let a = 0;
            // }

            // 缓动开始
            this.roleTween = tween(this.node)
                .to(speed, { position: movePos })
                .call(() => {
                    this.roleTween = null;
                    // this.node.position = movePos;
                    // 移动后逻辑
                    this.onMoveAfter();
                }).start();
        } else { // 不能移动
            // 重新设置不能移动的状态
            this.setState(state);
        }
    }

    protected curPos: Vec3 = null;
    public getCurPos(): Vec3 {
        if (this.curPos == null) {
            this.curPos = PositionCorrection.correction(this.node.worldPosition);
        }
        return this.curPos;
    }

    // 所有格子
    protected allGrid: GridBase[] = [];

    // 添加格子
    addGrid(grid: GridBase) {
        this.allGrid.push(grid);
    }

    // 删除格子
    removeGrid(grid: GridBase) {
        let i = this.allGrid.indexOf(grid);
        if (i >= 0) {
            this.allGrid.splice(i, 1);
            return true;
        }
        return false;
    }

    // 根据位置获取格子todo 考虑是否优化
    getGridByPos(v3: Vec3): GridBase {
        for (let v of this.allGrid) {
            if (v.getPos().equals(v3)) {
                return v;
            }
        }
        return null;
    }


    // 移动后逻辑
    protected onMoveAfter() {
        if (!this.isLive()) {
            return;
        }
        let state: ROLE_STATE = null;
        let curPos = this.getCurPos();
        for (let v of this.allGrid) {
            let s = v.onMoveAfter(curPos);
            if (s != null && (state == null || s > state)) {
                state = s;
            }
        }
        // 没有任何格子则坠落
        if (state == null) {
            state = ROLE_STATE.DROP;
        }
        // 设置状态
        this.setState(state);
    }

    // 移动前逻辑
    protected onMoveBefore(tarPos: Vec3): ROLE_STATE {
        let state: ROLE_STATE = null;
        for (let v of this.allGrid) {
            let s = v.onMoveBefore(tarPos);
            if (s != null && (state == null || s > state)) {
                state = s;
            }
        }
        // 没状态则保持当前状态
        if (state == null) {
            state = this.roleState;
        }
        return state; // 如果可以移动，则返回当前状态
    }

    // 被动逻辑
    protected onPassively(grid: GridBase): ROLE_STATE {
        let curPos = this.getCurPos();
        let state: ROLE_STATE = grid.onPosChanged(curPos);
        return state;
    }

    // 执行被动逻辑
    passivelyLogic(grid: GridBase) {
        let state = this.onPassively(grid);
        if (state) {
            this.setState(state, grid);
        }
    }

    protected onKeyDown(event) {
        switch (event.keyCode) {
            case macro.KEY.w:
                this.setState(ROLE_STATE.MOVE_UP);
                break;
            case macro.KEY.s:
                this.setState(ROLE_STATE.MOVE_DOWN);
                break;
            case macro.KEY.a:
                this.setState(ROLE_STATE.MOVE_LEFT);
                break;
            case macro.KEY.d:
                this.setState(ROLE_STATE.MOVE_RIGHT);
                break;
            case macro.KEY.space:
                // this.jump();
                break;
        }
    }

    protected _pressedX = 0;
    protected _pressedY = 0;

    protected onViewTouchStart(event: Touch) {
        let location = event.getLocation();// 获取节点坐标
        this._pressedX = location.x;
        this._pressedY = location.y;
    }

    protected onViewTouchEnd(event: Touch) {
        let touchPoint = event.getLocation();
        let endX = this._pressedX - touchPoint.x;
        let endY = this._pressedY - touchPoint.y;

        if (Math.abs(endX) > Math.abs(endY)) {
            //手势向左右
            //判断向左还是向右 
            if (endX > 0) {
                // left
                this.setState(ROLE_STATE.MOVE_LEFT);
            } else {
                // right
                this.setState(ROLE_STATE.MOVE_RIGHT);
            }
        } else {
            //手势向上下
            //判断手势向上还是向下
            if (endY > 0) {
                // down
                this.setState(ROLE_STATE.MOVE_DOWN);
            } else {
                // up
                this.setState(ROLE_STATE.MOVE_UP);
            }
        }
    }

    // 无敌时间
    invincibleTime(time: number = 3) {
        if (!this.invincible) { // 无敌时间不能叠加
            this.invincible = true;
            this.scheduleOnce(this.uninvincibleTime, time);
        }
    }

    // 取消无敌时间
    uninvincibleTime() {
        this.invincible = false;
        this.scheduleOnce(this.onMoveAfter); // 不这样写的话，无敌时间有时会无限长
    }

    // 角色是否是活着的
    isLive() {
        return this.HP > 0 && this.getRoleState() != ROLE_STATE.DEAD;
    }

    // 计算两点距离(不算y轴)
    static get2PointsDis(pos1: Vec3, pos2: Vec3): number {
        let x = Math.abs(pos1.x - pos2.x);
        let z = Math.abs(pos1.z - pos2.z);
        return x + z;
    }
}
