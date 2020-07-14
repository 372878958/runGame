import { _decorator, v3, Enum, Vec3, Node, CCBoolean, ModelComponent, math, CCInteger } from 'cc';
import { PositionCorrection } from './PositionCorrection';
import { RoleControl, ROLE_STATE, MOVE_DIR } from './RoleControl';
const { ccclass, property, menu, icon } = _decorator;

type DamageCallback = (damage: number) => void;

export enum GRID_TYPE {
    实体,
    区域伤害,
    实体伤害,
    击退伤害,
    触发,
}
Enum(GRID_TYPE);

export enum MOVE_BACK_DIR {
    来源移动方向,
    角色逆向,
}
Enum(MOVE_BACK_DIR);

@ccclass('GridBase')
@icon("Map #2.png")
@menu("格子/基础块")
export class GridBase extends PositionCorrection {

    @property({
        type: CCBoolean,
        displayName: "是否有效"
    })
    get 有效() {
        return this.enabled;
    }
    set 有效(b: boolean) {
        this.enabled = b;
    }

    @property({
        type: CCBoolean,
        displayName: "是否显示模型"
    })
    get 显示模型() {
        if (this.model) {
            return this.model.enabled;
        }
        return false;
    }
    set 显示模型(b: boolean) {
        if (this.model) {
            this.model.enabled = b;
        }
    }
    // 角色是否在区域内
    protected _isPlayerEnter: boolean = false;
    // 角色是否在区域上
    protected playerIsStandByThis: boolean = false;

    @property({
        type: GRID_TYPE,
        displayName: "格子类型",
    })
    protected gridType: GRID_TYPE = GRID_TYPE.实体;

    @property({
        type: MOVE_BACK_DIR,
        displayName: "击退方向",
        visible: function () {
            return this.gridType == GRID_TYPE.击退伤害;
        }
    })
    protected moveBackDir: MOVE_BACK_DIR = MOVE_BACK_DIR.来源移动方向;

    @property({
        type: CCInteger,
        displayName: "伤害",
        visible: function () {
            return this.gridType == GRID_TYPE.击退伤害 || this.gridType == GRID_TYPE.区域伤害 || this.gridType == GRID_TYPE.实体伤害;
        }
    })
    protected damage: number = 1;

    onLoad() {
        if (!this.model) {
            this.model = this.getComponent(ModelComponent);
        } else {
            // if (!CC_EDITOR) {
            //     let com = this.getComponent(ModelComponent);
            //     if (com) {
            //         com.visibility = 0;
            //         com.enabled = false;
            //         com.destroy();
            //     }
            // }
        }
    }

    onFocusInEditor() {
        super.onFocusInEditor();
        this.onLoad();
    }

    onLostFocusInEditor() {
        super.onLostFocusInEditor();
        this.onLoad();
    }

    getType() {
        return this.gridType;
    }

    // 玩家是否在区域内
    isPlayerEnter() {
        return this._isPlayerEnter;
    }

    reset() {
        this.pos = null;
        this._isPlayerEnter = false;
        this.playerIsStandByThis = false;
    }

    private pos: Vec3 = null;
    // 获取世界坐标
    getPos() {
        if (this.pos == null) {
            this.pos = PositionCorrection.correction(this.node.worldPosition);
        }
        return this.pos;
    }

    private localPos: Vec3 = null;
    // 获取本地坐标
    getLocalPos() {
        if (this.localPos == null) {
            this.localPos = PositionCorrection.correction(this.node.position);
        }
        return this.localPos;
    }

    protected removeSelfOnRole() {
        let i = RoleControl.instance.allGrid.indexOf(this);
        if (i >= 0) {
            RoleControl.instance.allGrid.splice(i, 1);
        }
    }

    onEnable() {
        // // 移动监听
        // this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.lastWorldPos = v3(this.node.worldPosition);
        this.removeSelfOnRole();
        RoleControl.instance.allGrid.push(this);
        // 执行角色待机逻辑
        RoleControl.instance.passivelyLogic(this);
        // 刷新装备属性影响
        this.onEquipAttr();
    }

    onDisable() {
        this.reset();
        // // 移动监听
        // this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        this.removeSelfOnRole();
        // 执行角色待机逻辑
        RoleControl.instance.passivelyLogic(this);
    }

    protected lastWorldPos: Vec3 = Vec3.ZERO;
    update(dt: number) {
        // 判断坐标是否有变化
        if (!Vec3.strictEquals(this.lastWorldPos, this.node.worldPosition)) {
            this.onTransformChanged(dt);
        }
        if (!CC_EDITOR && this._inEditorModel) {
            cc.error("编辑器模型被保存了");
        }
    }

    // 获取当前移动速度
    getCurSpeed(): number {
        return this.curMoveSpeed;
    }

    // 当前移动方向
    protected curMoveDir: ROLE_STATE = null;
    // 当前移动速度(格/秒)
    protected curMoveSpeed: number = 0;
    // 坐标变化监听
    public onTransformChanged(dt: number) {
        // 计算移动方向
        this.curMoveDir = null;
        let x = this.node.worldPosition.x - this.lastWorldPos.x;
        let z = this.node.worldPosition.z - this.lastWorldPos.z;
        if (x && z) {
            Math.abs(x) > Math.abs(z) ? z = 0 : x = 0;
        }
        if (x) {
            this.curMoveSpeed = 1 / (Math.abs(x) / dt);
            this.curMoveDir = x < 0 ? ROLE_STATE.BE_MOVE_LEFT : ROLE_STATE.BE_MOVE_RIGHT;
        } else if (z) {
            this.curMoveSpeed = 1 / (Math.abs(z) / dt);
            this.curMoveDir = z < 0 ? ROLE_STATE.BE_MOVE_UP : ROLE_STATE.BE_MOVE_DOWN;
        }
        ////////////////////////////////////////////////////////////////
        this.lastWorldPos = v3(this.node.worldPosition);
        this.localPos = null;
        if (this.pos) {
            let lastPos = this.pos;
            this.pos = null;
            let curPos = this.getPos();
            if (!Vec3.strictEquals(lastPos, curPos)) {// 坐标变化了
                this.onPosChange();
            }
        }
    }

    // 响应坐标便哈
    protected onPosChange() {
        // 执行角色待机逻辑
        RoleControl.instance.passivelyLogic(this);
    }

    // 移动后逻辑
    onMoveAfter(pos: Vec3): ROLE_STATE {
        this.playerIsStandByThis = false;
        this._isPlayerEnter = false;
        let tarPos = PositionCorrection.correction(pos);
        let selfPos = this.getPos();
        let gridType = this.getType();
        switch (gridType) {
            case GRID_TYPE.触发:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 进入范围
                    this._isPlayerEnter = true;
                }
                break;
            case GRID_TYPE.实体:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 遇到障碍
                    return ROLE_STATE.MOVE_BACK;
                }
                --tarPos.y;
                if (Vec3.strictEquals(selfPos, tarPos)) { // 站在地面
                    this.playerIsStandByThis = true;
                    return ROLE_STATE.STAND;
                }
                break;
            case GRID_TYPE.区域伤害:
            case GRID_TYPE.实体伤害:
            case GRID_TYPE.击退伤害:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 进入范围
                    this._isPlayerEnter = true;
                    // 伤害判定 如果活着
                    let isLive = this.onDamage();
                    if (isLive && gridType == GRID_TYPE.击退伤害) {
                        if (this.moveBackDir == MOVE_BACK_DIR.来源移动方向) {
                            return this.curMoveDir == null ? ROLE_STATE.MOVE_BACK : this.curMoveDir;
                        } else {
                            return ROLE_STATE.MOVE_BACK;
                        }
                    } else if (!isLive) {
                        return ROLE_STATE.DEAD;
                    }
                }
                break;
        }
        return null;
    }

    // 移动前逻辑
    onMoveBefore(pos: Vec3): ROLE_STATE {
        let tarPos = PositionCorrection.correction(pos);
        let selfPos = this.getPos();
        switch (this.getType()) {
            case GRID_TYPE.实体:
            case GRID_TYPE.实体伤害:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 遇到障碍
                    return ROLE_STATE.BLOCK;
                }
                break;
            case GRID_TYPE.区域伤害:
            case GRID_TYPE.实体伤害:
            case GRID_TYPE.击退伤害:
                // 移动中的伤害块，会提前检测伤害（防止时间差 错过伤害）
                if (this.curMoveDir != null) {
                    return this.onMoveAfter(pos);
                }
                break;
        }
        return null;
    }

    // 格子位置变化了
    onPosChanged(pos: Vec3): ROLE_STATE {
        this.playerIsStandByThis = false;
        this._isPlayerEnter = false;
        let tarPos = PositionCorrection.correction(pos);
        let selfPos = this.getPos();
        let gridType = this.getType()
        switch (gridType) {
            case GRID_TYPE.触发:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 进入范围
                    this._isPlayerEnter = true;
                }
                break;
            case GRID_TYPE.实体:
                if (Vec3.strictEquals(selfPos, tarPos)) { // 被实体推走
                    this._isPlayerEnter = true;
                    if (this.curMoveDir) {
                        return this.curMoveDir;
                    } else {
                        return ROLE_STATE.MOVE_BACK;
                    }
                }
                --tarPos.y;
                if (Vec3.strictEquals(selfPos, tarPos)) { // 站在地面
                    if (this.enabled) { // 如果有效则站立
                        this.playerIsStandByThis = true;
                        return ROLE_STATE.STAND;
                    } else { // 否则坠落
                        return ROLE_STATE.DROP;
                    }
                }
                break;
            case GRID_TYPE.区域伤害:
            case GRID_TYPE.实体伤害:
            case GRID_TYPE.击退伤害:
                return this.onMoveAfter(pos);
        }
        return null;
    }

    // 伤害判定
    protected onDamage(): boolean {
        let ret = RoleControl.instance.onDamageHP(this.damage);
        if (this.damageCallback) {
            this.damageCallback(this.damage);
        }
        return ret;
    }


    protected damageCallback: DamageCallback = null;
    public setDamageCallback(cb: DamageCallback) {
        this.damageCallback = cb;
    }

    // 响应主角装备属性
    onEquipAttr() {

    }
}
