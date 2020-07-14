import { _decorator, Component, Node, BatchingUtility } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('BatchingNode')
@menu("扩展组件/节点合批")
export class BatchingNode extends Component {
    onLoad() {
        BatchingUtility.batchStaticModel(this.node, this.node);
    }
}
