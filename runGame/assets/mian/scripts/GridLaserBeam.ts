import { _decorator, Node, v3, Vec3 } from 'cc';
import { GridBase, GRID_TYPE } from './GridBase';
import { RoleControl } from './RoleControl';
import { PositionCorrection } from './PositionCorrection';
const { ccclass, property, menu } = _decorator;

@ccclass('GridLaserBeam')
@menu("格子/激光束")
export class GridLaserBeam extends GridBase {

    // @property({
    //     readonly: true
    // })
    protected gridType: GRID_TYPE = GRID_TYPE.区域伤害;

    @property({
        type: Node,
        displayName: "射线模型根节点"
    })
    protected rayRootNode: Node = null;

    @property({
        displayName: "最大长度"
    })
    protected maxLength = 20;

    @property({
        type: GridBase,
        displayName: "激活目标"
    })
    protected activeTarget: GridBase = null;

    // 当前长度
    protected curLength = 0;

    onEnable() {
        GridBase.allLaserBeam.push(this);
        if (super.onEnable) {
            super.onEnable();
        }
    }

    onDisable() {
        let i = GridBase.allLaserBeam.indexOf(this);
        if (i >= 0) {
            GridBase.allLaserBeam.splice(i, 1);
        }
        if (super.onDisable) {
            super.onDisable();
        }
    }

    // 射线检测
    protected rayCheck() {
        if (!this.rayRootNode) {
            return;
        }
        this.curLength = this.activeTarget ? 0 : this.maxLength;
        for (let i = 0; i < this.maxLength; ++i) {
            this.rayRootNode.position = v3(0, 0, -i);
            let pos = PositionCorrection.correction(this.rayRootNode.worldPosition);
            let grids = RoleControl.instance.getGridByPos(pos);
            let setLength = false; // 是否设置长度
            for (let grid of grids) {
                if (grid && grid != this) {
                    if (this.activeTarget) {
                        // 需要激活目标
                        if (this.activeTarget == grid) {
                            // 找到的首个目标如果是激活目标则激活
                            setLength = true;
                        } else {
                            // 不是的话则关闭     
                            break;
                        }
                    } else {
                        // 不需要激活目标
                        let gridType = grid.getGridType();
                        if (gridType == GRID_TYPE.实体 ||
                            gridType == GRID_TYPE.可碎实体 ||
                            gridType == GRID_TYPE.实体伤害 ||
                            gridType == GRID_TYPE.滑块 ||
                            gridType == GRID_TYPE.已碎状态 ||
                            gridType == GRID_TYPE.箭矢) {
                            setLength = true;
                        }
                    }
                    // 设置长度
                    if (setLength) {
                        this.curLength = i ? i : i - 1;
                        break;
                    }
                }
            }
            if (setLength) {
                break;
            }
        }
        this.updateRayLength();
    }

    // 刷新射线长度
    protected updateRayLength() {
        let newScale = v3(1, 1, this.curLength);
        if (!this.rayRootNode.scale.equals(newScale)) {
            // 执行角色待机逻辑
            RoleControl.instance.passivelyLogic(this);
        }
        this.rayRootNode.scale = newScale;
        this.rayRootNode.position = v3(0, 0, -this.curLength / 2 + 0.5);
    }

    // 是否在格子范围内
    protected isInGrid(tarPos: Vec3, selfPos: Vec3 = null): boolean {
        let ret = false;
        let basePos = v3(this.rayRootNode.position);
        for (let i = 0; i < this.curLength; ++i) {
            this.rayRootNode.position = v3(0, 0, -i);
            if (tarPos.equals(this.rayRootNode.worldPosition)) {
                ret = true;
                break;
            }
        }
        this.rayRootNode.position = basePos;
        return ret;
    }

    // 响应主角装备属性
    onEquipAttr() {
        super.onEquipAttr();
    }
}
