import { _decorator, Component, Node, v3, Vec3, ModelComponent, utils, primitives, Material } from 'cc';
const { ccclass, property, menu, disallowMultiple, executeInEditMode } = _decorator;

@ccclass('PositionCorrection')
@menu("格子/坐标修正")
@disallowMultiple
@executeInEditMode
export class PositionCorrection extends Component {

    protected _inEditorModel: ModelComponent = null;
    @property({
        type: ModelComponent,
        displayName: "模型"
    })
    protected get model() {
        return this._model;
    }
    protected set model(m: ModelComponent) {
        if (this._model != m) {
            this._model = m;
            this.onEditorModel();
        }
    }
    // 自身模型
    @property
    protected _model: ModelComponent = null;

    start() {
        this.onEditorModel();
    }

    protected onEditorModel() {
        if (CC_EDITOR) {
            if (!this._inEditorModel) {
                let mc = this.getComponent(ModelComponent);
                if (!mc) {
                    this._inEditorModel = this.addComponent(ModelComponent);
                } else if (!mc.mesh) {
                    this._inEditorModel = mc;
                }
            }
            if (this._inEditorModel) {
                if (this.model && this.model.material) {
                    // 判断子节点到副节点的层级数量
                    let offset = 0;
                    let isParent = (node: Node) => {
                        if (node && node != this.node) {
                            offset += 0.01;
                            isParent(node.parent);
                        }
                    }
                    isParent(this.model.node);
                    //////////////////////////////////////////////
                    this._inEditorModel.mesh = utils.createMesh(primitives.box({ width: 1 + offset, height: 1 + offset, length: 1 + offset }));
                    const mat = new Material();
                    mat.initialize({
                        effectName: 'builtin-billboard',
                    });
                    this._inEditorModel.material = mat;
                } else {
                    this._inEditorModel.mesh = utils.createMesh(primitives.sphere(0.5));
                    this._inEditorModel.material = null;
                }
            }
        }
    }

    onFocusInEditor() {
        this.node.setPosition(PositionCorrection.correction(this.node.position));
    }
    onLostFocusInEditor() {
        this.node.setPosition(PositionCorrection.correction(this.node.position));
    }
    // 修正坐标
    public static correction(pos: Vec3): Vec3 {
        return v3(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
    }
}