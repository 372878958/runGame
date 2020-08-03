import { _decorator, Component, Node, loader, Prefab, instantiate, JsonAsset, error, v3 } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('GenerateMap')
@menu("格子/地图生成")
export class GenerateMap extends Component {
    @property({
        displayName: "文件路径",
        // editorOnly: true,
    })
    protected path: string = "";

    @property({
        displayName: "生成地图",
        // editorOnly: true,
    })
    get generateMap(): boolean {
        return this._generateMap;
    }
    set generateMap(b: boolean) {
        if (this._generateMap != b) {
            this._generateMap = b;
            if (b) {
                // this.node.addChild(new Node("test"));
                // 加载 Prefab
                // loader.loadRes("test assets/prefab", Prefab, (err: any, prefab: Prefab) => {
                //     const newNode = instantiate(prefab);
                //     this.node.addChild(newNode);
                // });

                // 加载 AnimationClip
                loader.loadRes(this.path, JsonAsset, (err: any, asset: JsonAsset) => {
                    if (err) {
                        error(err);
                    } else {
                        // error("json = " + JSON.stringify(asset.json));
                        let array: number[] = <number[]>asset.json;
                        if (array && array.length) {
                            for (let i = 0; i < array.length; ++i) {
                                let x = i % 9;
                                let z = -Math.floor(i / 9);
                                let id = array[i];
                                let pathPrefab: string = null;
                                let prefabName: string = null;
                                switch (id) {
                                    case 0:
                                        break;
                                    case 1:
                                        pathPrefab = "地图块/grid_普通地面.prefab";
                                        prefabName = "grid_普通地面";
                                        break;
                                    case 2:
                                        pathPrefab = "地图块/grid_下落地面.prefab";
                                        prefabName = "grid_下落地面";
                                        break;
                                    default:
                                        break;
                                }
                                if (pathPrefab) {
                                    // 加载 Prefab
                                    loader.loadRes(pathPrefab, Prefab, (err: any, prefab: Prefab) => {
                                        if (err) {
                                            error(err);
                                        } else {
                                            const newNode = instantiate(prefab);
                                            newNode.name = prefabName + x + "_" + -z;
                                            this.node.addChild(newNode);
                                            newNode.position = v3(x, 0, z);
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }
        }
    }
    protected _generateMap = false;
}
